import { NextRequest, NextResponse } from "next/server";
import { processDueJobs } from "@/lib/services/jobs";
import { db } from "@/lib/db";

// POST /api/jobs/process — cron-safe, idempotent entrypoint
export async function POST(request: NextRequest) {
  // Optional: simple auth token for cron protection
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await processDueJobs();

  // Fetch recent job runs for observability
  const recentJobs = await db.job.findMany({
    where: { completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 10,
    select: {
      id: true,
      type: true,
      status: true,
      durationMs: true,
      retryCount: true,
      errorMessage: true,
      completedAt: true,
    },
  });

  return NextResponse.json({
    ...result,
    recentRuns: recentJobs,
    timestamp: new Date().toISOString(),
  });
}
