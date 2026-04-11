import { NextResponse } from "next/server";
import {
  cryptoProvider,
  getMsalClient,
  getRedirectUri,
  GRAPH_SCOPES,
} from "@/lib/auth";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const msal = getMsalClient();
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
    const state = cryptoProvider.createNewGuid();

    const session = await getSession();
    session.oauthState = state;
    session.oauthVerifier = verifier;
    await session.save();

    const url = await msal.getAuthCodeUrl({
      scopes: GRAPH_SCOPES,
      redirectUri: getRedirectUri(),
      codeChallenge: challenge,
      codeChallengeMethod: "S256",
      state,
      prompt: "select_account",
    });

    return NextResponse.redirect(url);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Login failed", detail: err.message },
      { status: 500 }
    );
  }
}
