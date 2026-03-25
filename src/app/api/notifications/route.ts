import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getNotifications, getUnreadCount } from "@/lib/services/notifications";

export async function GET() {
  const userId = await getCurrentUserId();
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(userId),
    getUnreadCount(userId),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
