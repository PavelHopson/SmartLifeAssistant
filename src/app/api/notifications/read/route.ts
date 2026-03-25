import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { markAsRead, markAllAsRead } from "@/lib/services/notifications";

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();

  if (body.all) {
    await markAllAsRead(userId);
    return NextResponse.json({ success: true });
  }

  if (body.ids && Array.isArray(body.ids)) {
    await markAsRead(userId, body.ids);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide ids or all:true" }, { status: 400 });
}
