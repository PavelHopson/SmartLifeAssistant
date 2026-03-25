import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchTransactions } from "@/lib/truelayer/client";
import { importTransactions } from "@/lib/services/transaction-import";
import { detectSubscriptions } from "@/lib/services/subscription-detection";

export async function POST() {
  try {
    // TODO: get actual userId from auth session
    const userId = "demo";

    const connections = await db.providerConnection.findMany({
      where: { userId, status: "connected" },
      include: { accounts: true },
    });

    if (connections.length === 0) {
      return NextResponse.json(
        { error: "No connected accounts" },
        { status: 400 }
      );
    }

    let totalImported = 0;
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    for (const conn of connections) {
      if (!conn.accessToken) continue;

      for (const account of conn.accounts) {
        const rawTx = await fetchTransactions(
          conn.accessToken,
          account.externalId,
          sixMonthsAgo.toISOString(),
          now.toISOString()
        );

        const result = await importTransactions(userId, account.id, rawTx);
        totalImported += result.imported;

        await db.account.update({
          where: { id: account.id },
          data: { lastSyncedAt: now },
        });
      }
    }

    // Run subscription detection after import
    const subsDetected = await detectSubscriptions(userId);

    return NextResponse.json({
      imported: totalImported,
      subscriptionsDetected: subsDetected,
    });
  } catch (err) {
    console.error("Transaction sync error:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
