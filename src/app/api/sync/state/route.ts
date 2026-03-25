import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET() {
  const userId = await getCurrentUserId();

  // Return last sync timestamps for each data type
  const [lastTransaction, lastSubscription, lastAction, lastNotification] =
    await Promise.all([
      db.transaction.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      db.subscription.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      db.aiAction.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      db.notification.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

  return NextResponse.json({
    userId,
    syncState: {
      transactions: lastTransaction?.createdAt || null,
      subscriptions: lastSubscription?.updatedAt || null,
      actions: lastAction?.updatedAt || null,
      notifications: lastNotification?.createdAt || null,
    },
    serverTime: new Date().toISOString(),
  });
}
