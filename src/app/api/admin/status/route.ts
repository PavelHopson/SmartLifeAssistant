import { NextRequest, NextResponse } from "next/server";
import { getAdminStatus } from "@/lib/services/admin-status";
import { getConfigStatus, getConfigWarnings } from "@/lib/config/env";

// Protected admin status endpoint
export async function GET(request: NextRequest) {
  // Simple protection: require CRON_SECRET or dev mode
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const [status, config, warnings] = await Promise.all([
    getAdminStatus(),
    getConfigStatus(),
    getConfigWarnings(),
  ]);

  return NextResponse.json({
    ...status,
    config,
    warnings,
    timestamp: new Date().toISOString(),
  });
}
