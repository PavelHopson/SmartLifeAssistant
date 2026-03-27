import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/services/analytics";
import { invalidateDailyFocusCache } from "@/lib/services/daily-focus";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  const body = await req.json();
  const { actionId } = body;

  if (!actionId) {
    return NextResponse.json({ error: "actionId required" }, { status: 400 });
  }

  const action = await db.aiAction.findFirst({
    where: { id: actionId, userId, status: { notIn: ["done", "expired"] } },
  });

  if (!action) {
    return NextResponse.json({ error: "not found or already done" }, { status: 404 });
  }

  const updated = await db.aiAction.update({
    where: { id: actionId },
    data: { status: "done", completedAt: new Date() },
  });

  const isHealth = action.kind.startsWith("health_");
  await trackEvent({
    userId,
    eventType: isHealth ? "health_action_completed_v2" : "money_action_completed",
    entityType: "ai_action",
    entityId: actionId,
    metadata: { kind: action.kind, impactAmount: action.impactAmount },
  });

  await trackEvent({
    userId,
    eventType: "action_marked_done",
    entityType: "ai_action",
    entityId: actionId,
  });

  invalidateDailyFocusCache(userId);

  return NextResponse.json({ action: updated });
}
