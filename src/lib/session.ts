import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";

export interface ClearSarSession {
  userId?: string;
  email?: string;
  name?: string;
  oauthState?: string;
  oauthVerifier?: string;
}

const password =
  process.env.SESSION_SECRET ??
  "dev-only-secret-please-change-me-to-a-long-random-string";

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "clearsar_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getSession() {
  return getIronSession<ClearSarSession>(cookies(), sessionOptions);
}
