import { db } from "@/lib/db";

export interface CompletionFeedback {
  type: "savings" | "health" | "tasks" | "mixed";
  headline: string;
  detail: string;
  metric: string | null;
}

const HEALTH_KINDS = new Set(["health_workout", "health_walk", "health_hydration", "health_sleep"]);

export async function getCompletionFeedback(userId: string): Promise<CompletionFeedback | null> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [completedToday, totalSaved, tasksDoneToday] = await Promise.all([
    db.aiAction.findMany({
      where: { userId, status: "done", completedAt: { gte: startOfDay } },
      select: { kind: true, impactAmount: true, title: true },
    }),
    db.aiAction.aggregate({
      where: { userId, status: "done", impactAmount: { not: null } },
      _sum: { impactAmount: true },
    }),
    db.task.count({
      where: { userId, status: "done", completedAt: { gte: startOfDay } },
    }),
  ]);

  if (completedToday.length === 0 && tasksDoneToday === 0) return null;

  const healthDone = completedToday.filter((a) => HEALTH_KINDS.has(a.kind));
  const moneyDone = completedToday.filter((a) => !HEALTH_KINDS.has(a.kind));
  const todaySavings = moneyDone.reduce((sum, a) => sum + (a.impactAmount || 0), 0);
  const allTimeSavings = totalSaved._sum.impactAmount || 0;

  // Priority: savings > health > tasks
  if (todaySavings > 0) {
    return {
      type: "savings",
      headline: `£${Math.round(todaySavings)}/yr saved today`,
      detail: `${moneyDone.length} financial action${moneyDone.length > 1 ? "s" : ""} completed. Total lifetime savings: £${Math.round(allTimeSavings)}/yr.`,
      metric: `£${Math.round(allTimeSavings)}`,
    };
  }

  if (healthDone.length > 0) {
    const kinds = healthDone.map((a) => a.kind.replace("health_", "")).join(", ");
    return {
      type: "health",
      headline: `${healthDone.length} health action${healthDone.length > 1 ? "s" : ""} done`,
      detail: `Great work on ${kinds}. Keep building healthy habits.`,
      metric: null,
    };
  }

  if (completedToday.length > 0 || tasksDoneToday > 0) {
    const total = completedToday.length + tasksDoneToday;
    return {
      type: "tasks",
      headline: `${total} item${total > 1 ? "s" : ""} completed today`,
      detail: "You're making progress. Keep going!",
      metric: null,
    };
  }

  return null;
}
