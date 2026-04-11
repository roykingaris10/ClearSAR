import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./db";

export async function requireSessionUser() {
  const session = await getSession();
  if (!session.userId) redirect("/");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) redirect("/");
  return user;
}
