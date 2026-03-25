import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, fetchAccounts } from "@/lib/truelayer/client";
import { db } from "@/lib/db";
import { runPostConnectionFlow } from "@/lib/services/onboarding";
import { trackEvent } from "@/lib/services/analytics";
import { getCurrentUserId } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logging/logger";

const log = createLogger("truelayer-callback");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    log.warn("Auth failed", { error: error || "no code" });
    return NextResponse.redirect(
      new URL("/onboarding?error=auth_failed", request.url)
    );
  }

  const userId = await getCurrentUserId();

  try {
    // 1. Exchange code for tokens
    log.info("Exchanging code", { userId });
    const tokens = await exchangeCode(code);

    // 2. Create provider connection
    const connection = await db.providerConnection.create({
      data: {
        userId,
        provider: "truelayer",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: "connected",
      },
    });
    log.info("Connection created", { connectionId: connection.id, userId });

    // 3. Import accounts
    const accounts = await fetchAccounts(tokens.access_token);
    log.info("Accounts fetched", { count: accounts.length, userId });

    for (const acc of accounts) {
      await db.account.upsert({
        where: {
          providerConnectionId_externalId: {
            providerConnectionId: connection.id,
            externalId: acc.account_id,
          },
        },
        create: {
          userId,
          providerConnectionId: connection.id,
          externalId: acc.account_id,
          name: acc.display_name,
          type: acc.account_type,
          currency: acc.currency,
          rawPayload: JSON.parse(JSON.stringify(acc)),
        },
        update: {
          name: acc.display_name,
          currency: acc.currency,
        },
      });
    }

    // 4. Track analytics
    await trackEvent({
      userId,
      eventType: "bank_connected",
      entityType: "provider_connection",
      entityId: connection.id,
      metadata: { provider: "truelayer", accountCount: accounts.length },
    });

    // 5. Trigger onboarding flow
    await runPostConnectionFlow(userId);

    return NextResponse.redirect(
      new URL("/onboarding?step=analyzing", request.url)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error("Callback failed", { userId }, err instanceof Error ? err : undefined);

    // Update connection status to error if we can find it
    await db.providerConnection.updateMany({
      where: { userId, provider: "truelayer", status: "connected" },
      data: { status: "error" },
    }).catch(() => {});

    return NextResponse.redirect(
      new URL(`/onboarding?error=connection_failed&detail=${encodeURIComponent(message)}`, request.url)
    );
  }
}
