import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getConfigStatus, getConfigWarnings } from "@/lib/config/env";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string; mode?: string }> = {};

  // DB connectivity
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (e) {
    checks.database = { ok: false, detail: e instanceof Error ? e.message : "Connection failed" };
  }

  // All config statuses
  const configStatus = getConfigStatus();
  for (const [key, value] of Object.entries(configStatus)) {
    if (key === "database") continue; // Already checked with real connectivity
    checks[key] = {
      ok: value.configured,
      mode: value.mode,
      detail: value.configured ? "configured" : "not configured",
    };
  }

  const warnings = getConfigWarnings();
  const criticalFailed = !checks.database?.ok;
  const allConfigured = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: criticalFailed ? "unhealthy" : allConfigured ? "healthy" : "degraded",
      checks,
      warnings,
      timestamp: new Date().toISOString(),
    },
    { status: criticalFailed ? 503 : 200 }
  );
}
