import { db } from "@/lib/db";
import type { SubscriptionStatus } from "@/lib/domain/types";

interface GenerationResult {
  created: number;
  updated: number;
}

// Generate ai_actions from detected subscriptions
export async function generateActionsFromSubscriptions(
  userId: string
): Promise<GenerationResult> {
  const subscriptions = await db.subscription.findMany({
    where: { userId },
  });

  let created = 0;
  let updated = 0;
  const groupId = crypto.randomUUID();

  for (const sub of subscriptions) {
    const action = buildActionForSubscription(sub, userId, groupId);
    if (!action) continue;

    const existing = await db.aiAction.findFirst({
      where: {
        userId,
        sourceType: "subscription",
        sourceId: sub.id,
        status: { notIn: ["done", "failed", "expired"] },
      },
    });

    if (existing) {
      await db.aiAction.update({
        where: { id: existing.id },
        data: {
          title: action.title,
          summary: action.summary,
          explanation: action.explanation,
          impactAmount: action.impactAmount,
          confidenceScore: action.confidenceScore,
          groupId,
        },
      });
      updated++;
    } else {
      await db.aiAction.create({ data: action });
      created++;
    }
  }

  return { created, updated };
}

function buildActionForSubscription(
  sub: {
    id: string;
    userId: string;
    merchantName: string;
    normalizedName: string;
    estimatedAmount: number;
    currency: string;
    frequency: string;
    status: string;
    potentialSaving: number | null;
    daysSinceLastUse: number | null;
    lastChargeDate: Date | null;
  },
  userId: string,
  groupId: string
) {
  const status = sub.status as SubscriptionStatus;
  const yearlyAmount = calculateYearlyImpact(sub.estimatedAmount, sub.frequency);

  if (status === "unused") {
    const days = sub.daysSinceLastUse || daysSince(sub.lastChargeDate);
    return {
      userId,
      kind: "cancel_subscription",
      status: "pending_user",
      priority: 0, // urgent
      groupId,
      sourceType: "subscription",
      sourceId: sub.id,
      title: `Cancel ${sub.merchantName}`,
      summary: `You're paying £${sub.estimatedAmount}/${freqShort(sub.frequency)} for ${sub.merchantName} but haven't used it. Cancel to save £${yearlyAmount}/year.`,
      explanation: days
        ? `Not used for ${days} days`
        : "No recent activity detected",
      impactAmount: yearlyAmount,
      confidenceScore: 0.9,
      riskLevel: "low",
      confirmationRequired: true,
    };
  }

  if (status === "duplicate") {
    return {
      userId,
      kind: "review_duplicate",
      status: "pending_user",
      priority: 0,
      groupId,
      sourceType: "subscription",
      sourceId: sub.id,
      title: `Review duplicate: ${sub.merchantName}`,
      summary: `${sub.merchantName} appears to be a duplicate subscription. You may be paying twice — £${yearlyAmount}/year potential waste.`,
      explanation: "Multiple charges detected for similar service",
      impactAmount: yearlyAmount,
      confidenceScore: 0.75,
      riskLevel: "low",
      confirmationRequired: true,
    };
  }

  if (status === "price_increase") {
    return {
      userId,
      kind: "downgrade_plan",
      status: "pending_user",
      priority: 1, // high
      groupId,
      sourceType: "subscription",
      sourceId: sub.id,
      title: `Review price increase: ${sub.merchantName}`,
      summary: `${sub.merchantName} has increased in price. Consider downgrading or switching plans.`,
      explanation: "Recent price change detected",
      impactAmount: null,
      confidenceScore: 0.7,
      riskLevel: "low",
      confirmationRequired: true,
    };
  }

  // Active subscriptions — no action needed
  return null;
}

function calculateYearlyImpact(amount: number, frequency: string): number {
  const multiplier: Record<string, number> = {
    weekly: 52,
    monthly: 12,
    yearly: 1,
    unknown: 12,
  };
  return Math.round(amount * (multiplier[frequency] || 12) * 100) / 100;
}

function freqShort(frequency: string): string {
  const map: Record<string, string> = {
    weekly: "wk",
    monthly: "mo",
    yearly: "yr",
    unknown: "mo",
  };
  return map[frequency] || "mo";
}

function daysSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}
