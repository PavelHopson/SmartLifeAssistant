import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import type { AiActionKind, AiActionStatus, RiskLevel } from "@/lib/domain/types";

export async function GET() {
  const userId = await getCurrentUserId();

  const actions = await db.aiAction.findMany({
    where: { userId },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    actions.map((a) => ({
      id: a.id,
      kind: a.kind as AiActionKind,
      title: a.title,
      summary: a.summary,
      explanation: a.explanation,
      status: a.status as AiActionStatus,
      priority: a.priority,
      riskLevel: a.riskLevel as RiskLevel,
      impactAmount: a.impactAmount,
      confidenceScore: a.confidenceScore,
      sourceType: a.sourceType,
      sourceId: a.sourceId,
      groupId: a.groupId,
    }))
  );
}
