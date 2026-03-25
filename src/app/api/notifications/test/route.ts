import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { sendNotification } from "@/lib/services/notifications";

export async function POST() {
  const userId = await getCurrentUserId();

  await sendNotification({
    userId,
    type: "savings_detected",
    title: "Savings detected!",
    body: "We found £127.94 in potential savings from your subscriptions.",
  });

  return NextResponse.json({ sent: true });
}
