// TrueLayer sandbox integration skeleton
// Docs: https://truelayer.com/docs

const SANDBOX_AUTH_URL = "https://auth.truelayer-sandbox.com";
const SANDBOX_API_URL = "https://api.truelayer-sandbox.com";
const PROD_AUTH_URL = "https://auth.truelayer.com";
const PROD_API_URL = "https://api.truelayer.com";

function getBaseUrls() {
  const isSandbox = process.env.TRUELAYER_SANDBOX === "true";
  return {
    authUrl: isSandbox ? SANDBOX_AUTH_URL : PROD_AUTH_URL,
    apiUrl: isSandbox ? SANDBOX_API_URL : PROD_API_URL,
  };
}

export function getAuthLink(state: string): string {
  const { authUrl } = getBaseUrls();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TRUELAYER_CLIENT_ID || "",
    redirect_uri: process.env.TRUELAYER_REDIRECT_URI || "",
    scope: "info accounts balance transactions",
    state,
  });
  return `${authUrl}/?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { authUrl } = getBaseUrls();
  const res = await fetch(`${authUrl}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: process.env.TRUELAYER_CLIENT_ID,
      client_secret: process.env.TRUELAYER_CLIENT_SECRET,
      redirect_uri: process.env.TRUELAYER_REDIRECT_URI,
      code,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

export async function fetchAccounts(accessToken: string) {
  const { apiUrl } = getBaseUrls();
  const res = await fetch(`${apiUrl}/data/v1/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Fetch accounts failed: ${res.status}`);
  const data = await res.json();
  return data.results as TrueLayerAccount[];
}

export async function fetchTransactions(
  accessToken: string,
  accountId: string,
  from: string,
  to: string
) {
  const { apiUrl } = getBaseUrls();
  const params = new URLSearchParams({ from, to });
  const res = await fetch(
    `${apiUrl}/data/v1/accounts/${accountId}/transactions?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Fetch transactions failed: ${res.status}`);
  const data = await res.json();
  return data.results as TrueLayerTransaction[];
}

// TrueLayer response shapes (subset)
export interface TrueLayerAccount {
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
  account_number?: { number: string; sort_code: string };
}

export interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: string;
  transaction_category: string;
  merchant_name?: string;
  meta?: Record<string, string>;
}
