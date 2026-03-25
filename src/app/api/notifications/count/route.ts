import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getUnreadCount } from "@/lib/services/notifications";

// Server endpoint for real unread notification count
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const count = await getUnreadCount(userId);
    return NextResponse.json({ count });
  } catch {
    // Graceful fallback for demo mode
    return NextResponse.json({ count: 0 });
  }
}
