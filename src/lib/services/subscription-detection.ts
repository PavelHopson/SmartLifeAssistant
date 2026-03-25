import { db } from "@/lib/db";
import type { SubscriptionFrequency, SubscriptionStatus } from "@/lib/domain/types";

interface DetectedSubscription {
  normalizedName: string;
  merchantName: string;
  estimatedAmount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  status: SubscriptionStatus;
  lastChargeDate: Date;
  transactionCount: number;
  potentialSaving: number | null;
}

// Detect recurring payments by grouping debit transactions by normalized merchant name
export async function detectSubscriptions(userId: string): Promise<number> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      direction: "debit",
      transactionDate: { gte: sixMonthsAgo },
    },
    orderBy: { transactionDate: "desc" },
  });

  // Group by normalized name
  const groups = new Map<
    string,
    { amounts: number[]; dates: Date[]; merchantName: string; currency: string }
  >();

  for (const tx of transactions) {
    const key = tx.normalizedName || tx.description;
    const group = groups.get(key) || {
      amounts: [],
      dates: [],
      merchantName: tx.merchantName || tx.description,
      currency: tx.currency,
    };
    group.amounts.push(tx.amount);
    group.dates.push(tx.transactionDate);
    groups.set(key, group);
  }

  const detected: DetectedSubscription[] = [];

  for (const [normalizedName, group] of groups) {
    if (group.amounts.length < 2) continue;

    const frequency = detectFrequency(group.dates);
    if (frequency === "unknown" && group.amounts.length < 3) continue;

    const avgAmount =
      group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;
    const isConsistent = checkAmountConsistency(group.amounts);

    if (!isConsistent && frequency === "unknown") continue;

    const status = determineStatus(group.dates, frequency, avgAmount);
    const potentialSaving = status === "unused" || status === "duplicate"
      ? avgAmount * (frequency === "yearly" ? 1 : 12)
      : null;

    detected.push({
      normalizedName,
      merchantName: group.merchantName,
      estimatedAmount: Math.round(avgAmount * 100) / 100,
      currency: group.currency,
      frequency,
      status,
      lastChargeDate: group.dates[0],
      transactionCount: group.amounts.length,
      potentialSaving: potentialSaving
        ? Math.round(potentialSaving * 100) / 100
        : null,
    });
  }

  // Upsert into DB
  let count = 0;
  for (const sub of detected) {
    await db.subscription.upsert({
      where: {
        userId_normalizedName: {
          userId,
          normalizedName: sub.normalizedName,
        },
      },
      create: {
        userId,
        merchantName: sub.merchantName,
        normalizedName: sub.normalizedName,
        estimatedAmount: sub.estimatedAmount,
        currency: sub.currency,
        frequency: sub.frequency,
        status: sub.status,
        lastChargeDate: sub.lastChargeDate,
        transactionCount: sub.transactionCount,
        potentialSaving: sub.potentialSaving,
      },
      update: {
        estimatedAmount: sub.estimatedAmount,
        frequency: sub.frequency,
        status: sub.status,
        lastChargeDate: sub.lastChargeDate,
        transactionCount: sub.transactionCount,
        potentialSaving: sub.potentialSaving,
      },
    });
    count++;
  }

  return count;
}

function detectFrequency(dates: Date[]): SubscriptionFrequency {
  if (dates.length < 2) return "unknown";

  const gaps: number[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const diffDays =
      (dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(diffDays);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  if (avgGap >= 5 && avgGap <= 10) return "weekly";
  if (avgGap >= 25 && avgGap <= 35) return "monthly";
  if (avgGap >= 350 && avgGap <= 380) return "yearly";

  return "unknown";
}

function checkAmountConsistency(amounts: number[]): boolean {
  if (amounts.length < 2) return true;
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  return amounts.every((a) => Math.abs(a - avg) / avg < 0.15);
}

function determineStatus(
  dates: Date[],
  frequency: SubscriptionFrequency,
  _amount: number
): SubscriptionStatus {
  const lastCharge = dates[0];
  const daysSinceLastCharge =
    (Date.now() - lastCharge.getTime()) / (1000 * 60 * 60 * 24);

  const thresholds: Record<SubscriptionFrequency, number> = {
    weekly: 21,
    monthly: 60,
    yearly: 400,
    unknown: 90,
  };

  if (daysSinceLastCharge > thresholds[frequency]) return "unused";
  return "active";
}
