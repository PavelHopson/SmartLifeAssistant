import { db } from "@/lib/db";
import { sendNotification } from "./notifications";
import { getUserStreaks } from "./streaks";
import { trackEvent } from "./analytics";

export interface DaySummary {
  actionsCompleted: number;
  tasksCompleted: number;
  openTasks: number;
  savingsToday: number;
  waterMet: boolean;
  workoutDone: boolean;
  bestStreak: string | null;
  meaningful: boolean;
}

export async function generateEndOfDaySummary(userId: string): Promise<DaySummary> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [actionsToday, tasksToday, openTasks, savingsAgg, healthProfile] = await Promise.all([
    db.aiAction.count({
      where: { userId, status: "done", completedAt: { gte: startOfDay } },
    }),
    db.task.count({
      where: { userId, status: "done", completedAt: { gte: startOfDay } },
    }),
    db.task.count({
      where: { userId, status: { in: ["open", "in_progress"] } },
    }),
    db.aiAction.aggregate({
      where: { userId, status: "done", completedAt: { gte: startOfDay }, impactAmount: { not: null } },
      _sum: { impactAmount: true },
    }),
    db.healthProfile.findUnique({ where: { userId } }),
  ]);

  let waterMet = false;
  let workoutDone = false;

  if (healthProfile) {
    const [waterToday, workoutsToday] = await Promise.all([
      db.healthLog.aggregate({
        where: { userId, type: "water", loggedAt: { gte: startOfDay } },
        _sum: { value: true },
      }),
      db.healthLog.count({
        where: { userId, type: "workout", loggedAt: { gte: startOfDay } },
      }),
    ]);
    waterMet = (waterToday._sum.value || 0) >= healthProfile.waterGoalPerDay;
    workoutDone = workoutsToday > 0;
  }

  const streaks = await getUserStreaks(userId);
  const bestStreak = streaks.bestStreak && streaks.bestStreak.currentStreak >= 2
    ? streaks.bestStreak.label
    : null;

  const savingsToday = savingsAgg._sum.impactAmount || 0;
  const meaningful = actionsToday > 0 || tasksToday > 0 || openTasks > 0 || savingsToday > 0;

  return {
    actionsCompleted: actionsToday,
    tasksCompleted: tasksToday,
    openTasks,
    savingsToday,
    waterMet,
    workoutDone,
    bestStreak,
    meaningful,
  };
}

export async function sendEndOfDaySummary(userId: string): Promise<boolean> {
  const summary = await generateEndOfDaySummary(userId);

  if (!summary.meaningful) {
    await trackEvent({ userId, eventType: "end_of_day_summary_generated" as any, metadata: { sent: false } });
    return false;
  }

  // Build concise body
  const lines: string[] = [];

  if (summary.actionsCompleted > 0) {
    lines.push(`${summary.actionsCompleted} action${summary.actionsCompleted > 1 ? "s" : ""} completed`);
  }
  if (summary.tasksCompleted > 0) {
    lines.push(`${summary.tasksCompleted} task${summary.tasksCompleted > 1 ? "s" : ""} done`);
  }
  if (summary.savingsToday > 0) {
    lines.push(`£${Math.round(summary.savingsToday)}/yr saved today`);
  }
  if (summary.openTasks > 0) {
    lines.push(`${summary.openTasks} task${summary.openTasks > 1 ? "s" : ""} still open`);
  }
  if (summary.waterMet) lines.push("Water goal met");
  if (summary.workoutDone) lines.push("Workout done");
  if (summary.bestStreak) lines.push(summary.bestStreak);

  const body = lines.join(" · ");

  await sendNotification({
    userId,
    type: "end_of_day_summary" as any,
    title: "Daily summary",
    body,
    relatedEntityType: "dashboard",
  });

  await trackEvent({
    userId,
    eventType: "end_of_day_summary_generated" as any,
    metadata: { sent: true, actionsCompleted: summary.actionsCompleted, savingsToday: summary.savingsToday },
  });

  return true;
}
