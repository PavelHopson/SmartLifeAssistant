import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { generateEndOfDaySummary, sendEndOfDaySummary } from "@/lib/services/end-of-day-summary";

// GET: preview summary without sending
export async function GET() {
  const userId = await getCurrentUserId();
  const summary = await generateEndOfDaySummary(userId);
  return NextResponse.json({ summary });
}

// POST: generate and send summary notification
export async function POST() {
  const userId = await getCurrentUserId();
  const sent = await sendEndOfDaySummary(userId);
  return NextResponse.json({ sent });
}
