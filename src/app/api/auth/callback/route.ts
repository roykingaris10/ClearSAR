import { NextRequest, NextResponse } from "next/server";
import { getRedirectUri, GRAPH_SCOPES } from "@/lib/auth";
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
    const tenantId = process.env.AZURE_TENANT_ID ?? "common";
    const clientId = process.env.AZURE_CLIENT_ID!;
    const clientSecret = process.env.AZURE_CLIENT_SECRET!;
    const redirectUri = getRedirectUri(req.url);

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope: GRAPH_SCOPES.join(" "),
    });

    if (session.oauthVerifier) {
      params.set("code_verifier", session.oauthVerifier);
    }

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("[callback] Token exchange failed:", tokenData.error_description ?? tokenData.error);
      return NextResponse.redirect(
        new URL(`/?error=callback_failed&detail=${encodeURIComponent(tokenData.error_description ?? tokenData.error)}`, req.url)
      );
    }

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
    console.error("[callback] Exception:", err.message);
    return NextResponse.redirect(
      new URL(`/?error=callback_failed&detail=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}
