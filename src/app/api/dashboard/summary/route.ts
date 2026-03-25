import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { generateDashboardSummary } from "@/lib/services/dashboard-summary";

export async function GET() {
  const userId = await getCurrentUserId();
  const summary = await generateDashboardSummary(userId);
  return NextResponse.json(summary);
}
