import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getDailyFocus } from "@/lib/services/daily-focus";

export async function GET() {
  const userId = await getCurrentUserId();
  const focus = await getDailyFocus(userId);
  return NextResponse.json(focus);
}
