import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/services/analytics";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  const body = await req.json();
  const { actionId, hours = 24 } = body;

  if (!actionId) {
    return NextResponse.json({ error: "actionId required" }, { status: 400 });
  }

  const action = await db.aiAction.findFirst({
    where: { id: actionId, userId },
  });

  if (!action) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Snooze by setting expiresAt to future, keeping status
  const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

  await db.aiAction.update({
    where: { id: actionId },
    data: { expiresAt: snoozeUntil },
  });

  await trackEvent({
    userId,
    eventType: "action_snoozed",
    entityType: "ai_action",
    entityId: actionId,
    metadata: { hours },
  });

  return NextResponse.json({ snoozedUntil: snoozeUntil.toISOString() });
}
