import { NextRequest, NextResponse } from "next/server";
import { getMsalClient, getRedirectUri, GRAPH_SCOPES } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { ensureDefaultTemplates } from "@/lib/templates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", req.url));
  }

  const session = await getSession();
  if (!state || state !== session.oauthState) {
    return NextResponse.redirect(new URL("/?error=invalid_state", req.url));
  }

  try {
    // Try direct token exchange first to diagnose MSAL issues
    const tenantId = process.env.AZURE_TENANT_ID ?? "common";
    const clientId = process.env.AZURE_CLIENT_ID!;
    const clientSecret = process.env.AZURE_CLIENT_SECRET!;
    const redirectUri = getRedirectUri();

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope: GRAPH_SCOPES.join(" "),
    });

    // Add PKCE code verifier if available
    if (session.oauthVerifier) {
      params.set("code_verifier", session.oauthVerifier);
    }

    const body = params.toString();
    // Log the encoded body to check if ~ is being mangled
    const secretInBody = body.match(/client_secret=([^&]*)/)?.[1] ?? "NOT FOUND";
    console.log("[callback] Attempting direct token exchange...");
    console.log("[callback] tokenUrl:", tokenUrl);
    console.log("[callback] client_id:", clientId);
    console.log("[callback] secret raw:", clientSecret);
    console.log("[callback] secret URL-encoded in body:", secretInBody);
    console.log("[callback] redirect_uri:", redirectUri);

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("[callback] Token exchange failed:", JSON.stringify(tokenData, null, 2));
      return NextResponse.redirect(
        new URL(`/?error=callback_failed&detail=${encodeURIComponent(JSON.stringify(tokenData))}`, req.url)
      );
    }

    console.log("[callback] Token exchange succeeded!");

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token ?? "";

    // Get user info from Microsoft Graph
    const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await meRes.json();

    const email = me.mail || me.userPrincipalName;
    const name = me.displayName ?? email;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        accessToken: encryptToken(accessToken),
        refreshToken: encryptToken(refreshToken),
        tokenExpiry: new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000),
      },
      create: {
        email,
        name,
        accessToken: encryptToken(accessToken),
        refreshToken: encryptToken(refreshToken),
        tokenExpiry: new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000),
      },
    });

    await ensureDefaultTemplates(user.id);

    session.userId = user.id;
    session.email = user.email;
    session.name = user.name ?? undefined;
    session.oauthState = undefined;
    session.oauthVerifier = undefined;
    await session.save();

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (err: any) {
    console.error("[callback] Exception:", err);
    return NextResponse.redirect(
      new URL(`/?error=callback_failed&detail=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}
