import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import { prisma } from "./db";
import { decryptToken, encryptToken } from "./crypto";
import { getMsalClient, GRAPH_SCOPES } from "./auth";

/**
 * Returns an authenticated Microsoft Graph client for a given user,
 * refreshing the access token if it is close to expiry.
 */
export async function getGraphClient(userId: string): Promise<Client> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  let accessToken = decryptToken(user.accessToken);

  // Refresh 2 minutes before actual expiry
  const refreshThreshold = new Date(Date.now() + 2 * 60 * 1000);
  if (user.tokenExpiry < refreshThreshold) {
    const refreshToken = decryptToken(user.refreshToken);
    const msal = getMsalClient();
    const result = await msal.acquireTokenByRefreshToken({
      refreshToken,
      scopes: GRAPH_SCOPES,
    });
    if (!result?.accessToken) {
      throw new Error("Failed to refresh access token");
    }
    accessToken = result.accessToken;
    await prisma.user.update({
      where: { id: userId },
      data: {
        accessToken: encryptToken(accessToken),
        tokenExpiry: result.expiresOn ?? new Date(Date.now() + 3600 * 1000),
      },
    });
  }

  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

export interface InboxMessage {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  receivedDate: string;
  bodyPreview: string;
  body: string;
  isRead: boolean;
}

/**
 * Fetches the most recent messages from the signed-in user's inbox.
 * For shared mailboxes, pass `mailbox` as the shared mailbox address.
 */
export async function fetchInboxMessages(
  userId: string,
  options: { since?: Date; top?: number; mailbox?: string } = {}
): Promise<InboxMessage[]> {
  const client = await getGraphClient(userId);
  const top = options.top ?? 50;
  const endpoint = options.mailbox
    ? `/users/${options.mailbox}/mailFolders/inbox/messages`
    : `/me/mailFolders/inbox/messages`;

  let request = client
    .api(endpoint)
    .select("id,subject,from,receivedDateTime,bodyPreview,body,isRead")
    .orderby("receivedDateTime desc")
    .top(top);

  if (options.since) {
    request = request.filter(
      `receivedDateTime ge ${options.since.toISOString()}`
    );
  }

  const response = await request.get();
  const messages = (response.value ?? []) as any[];

  return messages.map((m) => ({
    id: m.id,
    subject: m.subject ?? "(no subject)",
    fromName: m.from?.emailAddress?.name ?? "Unknown",
    fromEmail: m.from?.emailAddress?.address ?? "",
    receivedDate: m.receivedDateTime,
    bodyPreview: m.bodyPreview ?? "",
    body: m.body?.content ?? "",
    isRead: m.isRead ?? false,
  }));
}

/**
 * Sends an email OR creates a draft, depending on MAIL_SEND_MODE.
 * Default is "draft" for safe testing.
 */
export async function sendOrDraftEmail(
  userId: string,
  params: {
    to: string;
    subject: string;
    body: string;
  }
): Promise<{ mode: "draft" | "sent"; messageId?: string }> {
  const client = await getGraphClient(userId);
  const mode = process.env.MAIL_SEND_MODE === "send" ? "send" : "draft";

  const message = {
    subject: params.subject,
    body: {
      contentType: "Text",
      content: params.body,
    },
    toRecipients: [
      { emailAddress: { address: params.to } },
    ],
  };

  if (mode === "draft") {
    const created = await client.api("/me/messages").post(message);
    return { mode: "draft", messageId: created.id };
  }

  await client.api("/me/sendMail").post({
    message,
    saveToSentItems: true,
  });
  return { mode: "sent" };
}
