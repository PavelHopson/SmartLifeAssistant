import { db } from "@/lib/db";
import { trackEvent } from "./analytics";

interface HealthAction {
  kind: string;
  title: string;
  summary: string;
  explanation: string;
  confidenceScore: number;
  priority: number;
}

// Generate health-related actions based on profile goals vs actual logs
export async function generateHealthActions(userId: string): Promise<{ created: number }> {
  const profile = await db.healthProfile.findUnique({ where: { userId } });
  if (!profile || !profile.reminderEnabled) return { created: 0 };

  const actions: HealthAction[] = [];
  const now = new Date();

  // 1. Workout check — compare weekly goal vs actual
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const dayOfWeek = now.getDay(); // 0=Sun
  const workoutsThisWeek = await db.healthLog.count({
    where: { userId, type: "workout", loggedAt: { gte: startOfWeek } },
  });

  const daysLeft = 7 - dayOfWeek;
  const workoutsRemaining = profile.workoutGoalPerWeek - workoutsThisWeek;

  // Only alert if behind pace and at least mid-week
  if (workoutsRemaining > 0 && dayOfWeek >= 3 && workoutsRemaining >= daysLeft) {
    actions.push({
      kind: "health_workout",
      title: "Time to work out",
      summary: `You planned ${profile.workoutGoalPerWeek} workouts this week and completed ${workoutsThisWeek}. ${workoutsRemaining} left with ${daysLeft} days remaining.`,
      explanation: `${workoutsThisWeek}/${profile.workoutGoalPerWeek} workouts completed this week`,
      confidenceScore: 0.85,
      priority: workoutsRemaining > daysLeft ? 0 : 1,
    });
  }

  // 2. Walk/movement check — no walk logs for 3+ days
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const recentWalks = await db.healthLog.count({
    where: { userId, type: "walk", loggedAt: { gte: threeDaysAgo } },
  });

  if (recentWalks === 0) {
    const lastWalk = await db.healthLog.findFirst({
      where: { userId, type: "walk" },
      orderBy: { loggedAt: "desc" },
      select: { loggedAt: true },
    });
    const daysSince = lastWalk
      ? Math.floor((now.getTime() - lastWalk.loggedAt.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    actions.push({
      kind: "health_walk",
      title: "Take a walk",
      summary: daysSince
        ? `No walking activity logged for ${daysSince} days. Even a short walk helps.`
        : "No walking activity logged recently. A short walk can boost your energy.",
      explanation: daysSince
        ? `Last walk: ${daysSince} days ago`
        : "No walk logs found",
      confidenceScore: 0.75,
      priority: 2,
    });
  }

  // 3. Water check — missed goal for 2+ consecutive days
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  yesterday.setHours(0, 0, 0, 0);
  twoDaysAgo.setHours(0, 0, 0, 0);

  const waterYesterday = await db.healthLog.aggregate({
    where: {
      userId,
      type: "water",
      loggedAt: { gte: yesterday, lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000) },
    },
    _sum: { value: true },
  });

  const waterDayBefore = await db.healthLog.aggregate({
    where: {
      userId,
      type: "water",
      loggedAt: { gte: twoDaysAgo, lt: yesterday },
    },
    _sum: { value: true },
  });

  const yWater = waterYesterday._sum.value || 0;
  const dbWater = waterDayBefore._sum.value || 0;

  if (yWater < profile.waterGoalPerDay && dbWater < profile.waterGoalPerDay) {
    actions.push({
      kind: "health_hydration",
      title: "Drink more water",
      summary: `Water goal missed for 2 consecutive days (${Math.round(yWater)}/${profile.waterGoalPerDay} glasses yesterday). Stay hydrated.`,
      explanation: `Hydration below goal for 2 days`,
      confidenceScore: 0.8,
      priority: 1,
    });
  }

  // 4. Sleep check — below goal for 3+ nights
  const threeNightsAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const recentSleep = await db.healthLog.findMany({
    where: { userId, type: "sleep", loggedAt: { gte: threeNightsAgo } },
    orderBy: { loggedAt: "desc" },
    take: 3,
  });

  if (recentSleep.length >= 3) {
    const allBelowGoal = recentSleep.every((s) => s.value < profile.sleepGoalHours);
    if (allBelowGoal) {
      const avgSleep = recentSleep.reduce((sum, s) => sum + s.value, 0) / recentSleep.length;
      actions.push({
        kind: "health_sleep",
        title: "Improve your sleep",
        summary: `Sleep was below your ${profile.sleepGoalHours}h goal for 3 nights (avg ${avgSleep.toFixed(1)}h). Consider going to bed earlier.`,
        explanation: `Average ${avgSleep.toFixed(1)}h vs ${profile.sleepGoalHours}h goal over last 3 nights`,
        confidenceScore: 0.8,
        priority: 1,
      });
    }
  }

  // Deduplicate and create
  let created = 0;
  const groupId = crypto.randomUUID();

  for (const action of actions) {
    const existing = await db.aiAction.findFirst({
      where: {
        userId,
        kind: action.kind,
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
        sourceType: "health",
        title: action.title,
        summary: action.summary,
        explanation: action.explanation,
        confidenceScore: action.confidenceScore,
        riskLevel: "low",
        confirmationRequired: false,
      },
    });
    created++;
  }

  if (created > 0) {
    await trackEvent({
      userId,
      eventType: "health_action_generated" as any,
      metadata: { count: created, kinds: actions.map((a) => a.kind) },
    });
  }

  return { created };
}
