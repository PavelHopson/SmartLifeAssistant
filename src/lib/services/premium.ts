import { db } from "@/lib/db";

export type PlanType = "free" | "premium" | "trial";

export interface PlanInfo {
  plan: PlanType;
  isPremium: boolean;
  isTrial: boolean;
  trialUsed: boolean;
  expiresAt: string | null;
  daysRemaining: number | null;
}

export type PremiumFeature =
  | "advanced_reminders"
  | "guided_autopilot"
  | "premium_widgets"
  | "health_insights"
  | "premium_focus"
  | "advanced_summary"
  | "unlimited_actions"
  | "priority_support";

const TRIAL_DAYS = 7;

export async function getPlanInfo(userId: string): Promise<PlanInfo> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, planStartedAt: true, planExpiresAt: true, trialUsed: true },
  });

  if (!user) return { plan: "free", isPremium: false, isTrial: false, trialUsed: false, expiresAt: null, daysRemaining: null };

  const plan = user.plan as PlanType;
  const now = new Date();

  // Check if trial/premium has expired
  if ((plan === "trial" || plan === "premium") && user.planExpiresAt && user.planExpiresAt < now) {
    await db.user.update({ where: { id: userId }, data: { plan: "free" } });
    return { plan: "free", isPremium: false, isTrial: false, trialUsed: user.trialUsed, expiresAt: null, daysRemaining: null };
  }

  const isPremium = plan === "premium" || plan === "trial";
  const isTrial = plan === "trial";
  const daysRemaining = user.planExpiresAt
    ? Math.max(0, Math.ceil((user.planExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : null;

  return {
    plan,
    isPremium,
    isTrial,
    trialUsed: user.trialUsed,
    expiresAt: user.planExpiresAt?.toISOString() || null,
    daysRemaining,
  };
}

export async function startTrial(userId: string): Promise<PlanInfo> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { trialUsed: true } });
  if (user?.trialUsed) throw new Error("Trial already used");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await db.user.update({
    where: { id: userId },
    data: { plan: "trial", planStartedAt: now, planExpiresAt: expiresAt, trialUsed: true },
  });

  return getPlanInfo(userId);
}

export async function upgradeToPremium(userId: string): Promise<PlanInfo> {
  const now = new Date();
  // For MVP: set 1 year premium. In production: Stripe webhook would handle this.
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  await db.user.update({
    where: { id: userId },
    data: { plan: "premium", planStartedAt: now, planExpiresAt: expiresAt },
  });

  return getPlanInfo(userId);
}

export function canAccessFeature(planInfo: PlanInfo, feature: PremiumFeature): boolean {
  if (planInfo.isPremium) return true;

  // Free features (accessible to everyone)
  const freeFeatures: PremiumFeature[] = [];

  return freeFeatures.includes(feature);
}
