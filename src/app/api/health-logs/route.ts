import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { addHealthLog, getRecentLogs, deleteHealthLog } from "@/lib/services/health-logs";
import { trackEvent } from "@/lib/services/analytics";
import { invalidateDailyFocusCache } from "@/lib/services/daily-focus";

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as any;
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const logs = await getRecentLogs(userId, type || undefined, limit);
  return NextResponse.json({ logs });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  const body = await req.json();

  if (!body.type || body.value === undefined || !body.unit) {
    return NextResponse.json({ error: "type, value, unit required" }, { status: 400 });
  }

  const log = await addHealthLog(userId, {
    type: body.type,
    value: Number(body.value),
    unit: body.unit,
    note: body.note,
    loggedAt: body.loggedAt ? new Date(body.loggedAt) : undefined,
  });

  await trackEvent({
    userId,
    eventType: "health_log_added",
    entityType: "health_log",
    entityId: log.id,
    metadata: { type: body.type, value: body.value },
  });

  invalidateDailyFocusCache(userId);

  return NextResponse.json({ log });
}

export async function DELETE(req: Request) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const deleted = await deleteHealthLog(userId, id);
  return NextResponse.json({ deleted });
}
