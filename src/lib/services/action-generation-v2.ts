import { db } from "@/lib/db";
import { getUserSettings } from "./settings";
import { trackEvent } from "./analytics";

interface GeneratedAction {
  kind: string;
  title: string;
  summary: string;
  explanation: string;
  impactAmount: number | null;
  confidenceScore: number;
  sourceType: string;
  sourceId: string | null;
  priority: number;
}

// V2: Generate actions from multiple signals beyond subscriptions
export async function generateSmartActions(userId: string): Promise<{ created: number }> {
  const settings = await getUserSettings(userId);
  const actions: GeneratedAction[] = [];

  // 1. Spending anomaly detection
  const spendingActions = await detectSpendingAnomalies(userId);
  actions.push(...spendingActions);

  // 2. Stale task/action follow-ups
  const followUpActions = await detectStaleFollowUps(userId);
  actions.push(...followUpActions);

  // 3. New recurring charge detection
  const newRecurringActions = await detectNewRecurringCharges(userId);
  actions.push(...newRecurringActions);

  // Deduplicate: don't create actions that already exist for same source
  let created = 0;
  const groupId = crypto.randomUUID();

  for (const action of actions) {
    if (settings.staleActionReminders === false && action.kind.startsWith("follow_up")) {
      continue; // User disabled stale reminders
    }

    const existing = await db.aiAction.findFirst({
      where: {
        userId,
        kind: action.kind,
        sourceType: action.sourceType,
        sourceId: action.sourceId,
        status: { notIn: ["done", "failed", "expired"] },
      },
    });

    if (existing) continue;

    await db.aiAction.create({
      data: {
        userId,
        kind: action.kind,
        status: "pending_user",
        priority: action.priority,
        groupId,
        sourceType: action.sourceType,
        sourceId: action.sourceId,
        title: action.title,
        summary: action.summary,
        explanation: action.explanation,
        impactAmount: action.impactAmount,
        confidenceScore: action.confidenceScore,
        riskLevel: "low",
        confirmationRequired: true,
      },
    });
    created++;
  }

  if (created > 0) {
    await trackEvent({
      userId,
      eventType: "actions_generated",
      metadata: {
        count: created,
        sources: [...new Set(actions.map((a) => a.kind))],
        version: "v2",
      },
    });
  }

  return { created };
}

// Detect spending spikes: compare current month vs 3-month average per category
async function detectSpendingAnomalies(userId: string): Promise<GeneratedAction[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const currentMonthTx = await db.transaction.groupBy({
    by: ["category"],
    where: {
      userId,
      direction: "debit",
      transactionDate: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });

  const prevThreeMonthsTx = await db.transaction.groupBy({
    by: ["category"],
    where: {
      userId,
      direction: "debit",
      transactionDate: { gte: threeMonthsAgo, lt: startOfMonth },
    },
    _sum: { amount: true },
  });

  const prevAvgMap = new Map<string, number>();
  for (const row of prevThreeMonthsTx) {
    if (row.category && row._sum.amount) {
      prevAvgMap.set(row.category, row._sum.amount / 3);
    }
  }

  const actions: GeneratedAction[] = [];
  for (const row of currentMonthTx) {
    if (!row.category || !row._sum.amount) continue;
    const current = row._sum.amount;
    const avg = prevAvgMap.get(row.category);
    if (!avg || avg < 20) continue; // skip tiny categories

    const increase = current - avg;
    const pct = (increase / avg) * 100;

    if (pct > 50 && increase > 30) {
      actions.push({
        kind: "review_spending_spike",
        title: `Spending spike: ${row.category}`,
        summary: `You spent £${Math.round(current)} on ${row.category} this month — £${Math.round(increase)} more than your average of £${Math.round(avg)}.`,
        explanation: `${Math.round(pct)}% above your 3-month average`,
        impactAmount: Math.round(increase * 12),
        confidenceScore: Math.min(0.9, 0.5 + pct / 200),
        sourceType: "transaction",
        sourceId: null,
        priority: pct > 100 ? 0 : 1,
      });
    }
  }

  return actions;
}

// Detect stale manual-step actions and overdue high-priority tasks
async function detectStaleFollowUps(userId: string): Promise<GeneratedAction[]> {
  const now = new Date();
  const actions: GeneratedAction[] = [];

  // Manual-step actions older than 3 days
  const staleManual = await db.aiAction.findMany({
    where: {
      userId,
      status: "requires_manual_step",
      updatedAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    },
    take: 5,
  });

  for (const action of staleManual) {
    actions.push({
      kind: "follow_up_manual_step",
      title: `Follow up: ${action.title}`,
      summary: `"${action.title}" has been waiting for manual completion for over 3 days. Complete it or dismiss it.`,
      explanation: `Pending since ${action.updatedAt.toLocaleDateString("en-GB")}`,
      impactAmount: action.impactAmount,
      confidenceScore: 0.85,
      sourceType: "ai_action",
      sourceId: action.id,
      priority: 0,
    });
  }

  // Overdue high-priority tasks older than 2 days past due
  const overdueTasks = await db.task.findMany({
    where: {
      userId,
      status: { in: ["open", "in_progress"] },
      priority: { lte: 1 },
      dueAt: { lt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    },
    take: 3,
  });

  for (const task of overdueTasks) {
    actions.push({
      kind: "escalate_priority",
      title: `Overdue: ${task.title}`,
      summary: `"${task.title}" is overdue. Consider completing it now or rescheduling.`,
      explanation: `Due ${task.dueAt!.toLocaleDateString("en-GB")}, ${Math.floor((now.getTime() - task.dueAt!.getTime()) / (24 * 60 * 60 * 1000))} days overdue`,
      impactAmount: null,
      confidenceScore: 0.8,
      sourceType: "task",
      sourceId: task.id,
      priority: 0,
    });
  }

  return actions;
}

// Detect new recurring charges (appeared 2+ times recently, not yet tracked)
async function detectNewRecurringCharges(userId: string): Promise<GeneratedAction[]> {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const recentGroups = await db.transaction.groupBy({
    by: ["normalizedName"],
    where: {
      userId,
      direction: "debit",
      transactionDate: { gte: twoMonthsAgo },
      normalizedName: { not: null },
    },
    _count: true,
    _avg: { amount: true },
    having: { amount: { _count: { gte: 2 } } },
  });

  // Get existing subscriptions to exclude
  const existingSubs = await db.subscription.findMany({
    where: { userId },
    select: { normalizedName: true },
  });
  const existingNames = new Set(existingSubs.map((s) => s.normalizedName));

  const actions: GeneratedAction[] = [];
  for (const group of recentGroups) {
    if (!group.normalizedName || existingNames.has(group.normalizedName)) continue;
    if (!group._avg.amount || group._avg.amount < 3) continue;

    actions.push({
      kind: "review_new_recurring_charge",
      title: `New recurring: ${group.normalizedName}`,
      summary: `${group.normalizedName} has charged you ${group._count} times recently (avg £${Math.round(group._avg.amount * 100) / 100}). Is this expected?`,
      explanation: `${group._count} charges in the last 2 months`,
      impactAmount: Math.round(group._avg.amount * 12 * 100) / 100,
      confidenceScore: 0.65,
      sourceType: "transaction",
      sourceId: null,
      priority: 2,
    });
  }

  return actions;
}
