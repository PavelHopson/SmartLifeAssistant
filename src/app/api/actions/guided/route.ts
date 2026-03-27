import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getGuidedExecution } from "@/lib/services/guided-execution";
import { trackEvent } from "@/lib/services/analytics";

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(req.url);
  const actionId = searchParams.get("id");

  if (!actionId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const action = await db.aiAction.findFirst({
    where: { id: actionId, userId },
  });

  if (!action) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const guided = getGuidedExecution(action.kind, {
    title: action.title,
    summary: action.summary,
    explanation: action.explanation,
    impactAmount: action.impactAmount,
    sourceType: action.sourceType,
  });

  await trackEvent({
    userId,
    eventType: "action_guided_flow_opened",
    entityType: "ai_action",
    entityId: actionId,
    metadata: { kind: action.kind },
  });

  return NextResponse.json({ action, guided });
}
