import {
  ConfidentialClientApplication,
  Configuration,
  CryptoProvider,
} from "@azure/msal-node";

// Microsoft Entra ID (Azure AD) authentication via MSAL.
// Uses the OAuth 2.0 authorization code flow with PKCE.

export const GRAPH_SCOPES = [
  "offline_access",
  "User.Read",
  "Mail.Read",
  "Mail.ReadWrite",
  "Mail.Send",
];

function getMsalConfig(): Configuration {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID ?? "common";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Azure credentials not configured. Set AZURE_CLIENT_ID and AZURE_CLIENT_SECRET in .env"
    );
  }

  // Debug: log secret shape (remove after fixing auth)
  console.log(`[auth] clientId=${clientId}`);
  console.log(`[auth] secret length=${clientSecret.length}, starts="${clientSecret.slice(0, 6)}", ends="${clientSecret.slice(-4)}"`);
  console.log(`[auth] tenantId=${tenantId}`);

  return {
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  };
}

let msalInstance: ConfidentialClientApplication | null = null;

export function getMsalClient(): ConfidentialClientApplication {
  if (!msalInstance) {
    msalInstance = new ConfidentialClientApplication(getMsalConfig());
  }
  return msalInstance;
}

export function getRedirectUri(): string {
  return (
    process.env.AZURE_REDIRECT_URI ??
    "http://localhost:3000/api/auth/callback"
  );
}

export const cryptoProvider = new CryptoProvider();
