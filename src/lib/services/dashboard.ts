import { db } from "@/lib/db";
import type {
  DashboardMetrics,
  ActionCardView,
  AiActionKind,
  AiActionStatus,
  RiskLevel,
} from "@/lib/domain/types";
import { mockMetrics, mockActions } from "./mock-data";

const DEMO_USER_ID = "demo";

export async function getDashboardMetrics(
  userId: string
): Promise<DashboardMetrics> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [spending, savings, subCount, pendingCount, doneCount, totalCount] =
      await Promise.all([
        db.transaction.aggregate({
          where: {
            userId,
            direction: "debit",
            transactionDate: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),
        db.subscription.aggregate({
          where: { userId, potentialSaving: { not: null } },
          _sum: { potentialSaving: true },
        }),
        db.subscription.count({
          where: { userId, status: "active" },
        }),
        db.aiAction.count({
          where: { userId, status: { in: ["pending_user", "draft"] } },
        }),
        db.aiAction.count({
          where: { userId, status: "done" },
        }),
        db.aiAction.count({
          where: { userId },
        }),
      ]);

    return {
      monthlySpending: spending._sum.amount || 0,
      potentialSavings: savings._sum.potentialSaving || 0,
      activeSubscriptions: subCount,
      pendingActions: pendingCount,
      completedActions: doneCount,
      totalActions: totalCount,
      currency: "GBP",
    };
  } catch {
    if (userId === DEMO_USER_ID) return mockMetrics;
    throw new Error("Failed to load dashboard metrics");
  }
}

export async function getPendingActions(
  userId: string
): Promise<ActionCardView[]> {
  try {
    const actions = await db.aiAction.findMany({
      where: {
        userId,
        status: { in: ["pending_user", "draft"] },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      take: 10,
    });

    return actions.map((a) => ({
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
    }));
  } catch {
    if (userId === DEMO_USER_ID) return mockActions;
    throw new Error("Failed to load actions");
  }
}
