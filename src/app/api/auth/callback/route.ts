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
    const msal = getMsalClient();
    const result = await msal.acquireTokenByCode({
      code,
      scopes: GRAPH_SCOPES,
      redirectUri: getRedirectUri(),
      codeVerifier: session.oauthVerifier,
    });

    if (!result?.accessToken || !result.account) {
      return NextResponse.redirect(new URL("/?error=token_failed", req.url));
    }

    // MSAL Node does not return refresh_token directly — it keeps it in its
    // token cache. We read it from the in-memory cache for the account.
    const cache = msal.getTokenCache();
    const serialized = JSON.parse(cache.serialize());
    const refreshToken = extractRefreshToken(serialized) ?? "";

    const email =
      result.account.username || (result.idTokenClaims as any)?.preferred_username;
    const name = result.account.name ?? email;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        accessToken: encryptToken(result.accessToken),
        refreshToken: encryptToken(refreshToken),
        tokenExpiry: result.expiresOn ?? new Date(Date.now() + 3600 * 1000),
      },
      create: {
        email,
        name,
        accessToken: encryptToken(result.accessToken),
        refreshToken: encryptToken(refreshToken),
        tokenExpiry: result.expiresOn ?? new Date(Date.now() + 3600 * 1000),
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
    return NextResponse.redirect(
      new URL(`/?error=callback_failed&detail=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}

function extractRefreshToken(cache: any): string | null {
  if (!cache?.RefreshToken) return null;
  const tokens = Object.values(cache.RefreshToken) as any[];
  if (tokens.length === 0) return null;
  return tokens[0].secret ?? null;
}
