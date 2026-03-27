import { db } from "@/lib/db";
import { randomBytes } from "crypto";

/** Generate a unique referral code for a user */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (user?.referralCode) return user.referralCode;

  const code = randomBytes(4).toString("hex"); // 8 chars
  await db.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });
  return code;
}

/** Get referral link */
export function getReferralLink(code: string): string {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base}?ref=${code}`;
}

/** Apply referral on sign-up */
export async function applyReferral(newUserId: string, refCode: string) {
  const referrer = await db.user.findUnique({
    where: { referralCode: refCode },
    select: { id: true },
  });

  if (!referrer || referrer.id === newUserId) return null;

  // Check if already referred
  const existing = await db.referral.findUnique({
    where: { referredId: newUserId },
  });
  if (existing) return existing;

  await db.user.update({
    where: { id: newUserId },
    data: { referredByCode: refCode },
  });

  return db.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: newUserId,
      status: "signed_up",
    },
  });
}

/** Update referral status when referred user completes key actions */
export async function updateReferralStatus(
  userId: string,
  status: "activated" | "converted"
) {
  const referral = await db.referral.findUnique({
    where: { referredId: userId },
  });
  if (!referral) return;

  // Only upgrade status (signed_up → activated → converted)
  const order = { signed_up: 0, activated: 1, converted: 2 };
  if ((order[status] || 0) <= (order[referral.status as keyof typeof order] || 0)) return;

  await db.referral.update({
    where: { id: referral.id },
    data: { status },
  });
}

/** Get referral stats for a user */
export async function getReferralStats(userId: string) {
  const [user, referrals] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
    db.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    code: user?.referralCode || null,
    totalInvited: referrals.length,
    activated: referrals.filter((r) => r.status === "activated" || r.status === "converted").length,
    converted: referrals.filter((r) => r.status === "converted").length,
  };
}
