import { NextResponse } from "next/server";
import { getSession } from "./session";
import { prisma } from "./db";

export async function requireUser() {
  const session = await getSession();
  if (!session.userId) {
    return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { error: NextResponse.json({ error: "user_not_found" }, { status: 401 }) };
  }
  return { user };
}
