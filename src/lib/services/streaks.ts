import { db } from "@/lib/db";

export interface StreakInfo {
  type: "hydration" | "workout" | "task_completion" | "action_completion";
  currentStreak: number;
  label: string;
}

export interface UserStreaks {
  streaks: StreakInfo[];
  bestStreak: StreakInfo | null;
}

export async function getUserStreaks(userId: string): Promise<UserStreaks> {
  const streaks: StreakInfo[] = [];

  // Hydration streak: consecutive days meeting water goal
  const hydrationStreak = await getHydrationStreak(userId);
  if (hydrationStreak > 0) {
    streaks.push({
      type: "hydration",
      currentStreak: hydrationStreak,
      label: `${hydrationStreak}-day hydration streak`,
    });
  }

  // Workout weekly progress
  const workoutProgress = await getWorkoutWeekProgress(userId);
  if (workoutProgress.done > 0) {
    streaks.push({
      type: "workout",
      currentStreak: workoutProgress.done,
      label: `${workoutProgress.done}/${workoutProgress.goal} workouts this week`,
    });
  }

  // Task completion streak: consecutive days with at least 1 task completed
  const taskStreak = await getTaskCompletionStreak(userId);
  if (taskStreak > 0) {
    streaks.push({
      type: "task_completion",
      currentStreak: taskStreak,
      label: `${taskStreak}-day task streak`,
    });
  }

  // Action completion streak: consecutive days with at least 1 action done
  const actionStreak = await getActionCompletionStreak(userId);
  if (actionStreak > 0) {
    streaks.push({
      type: "action_completion",
      currentStreak: actionStreak,
      label: `${actionStreak}-day action streak`,
    });
  }

  streaks.sort((a, b) => b.currentStreak - a.currentStreak);
  return { streaks, bestStreak: streaks[0] || null };
}

async function getHydrationStreak(userId: string): Promise<number> {
  const profile = await db.healthProfile.findUnique({ where: { userId } });
  if (!profile) return 0;

  const goal = profile.waterGoalPerDay;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check backwards day by day (max 30 days)
  for (let i = 1; i <= 30; i++) {
    const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const water = await db.healthLog.aggregate({
      where: { userId, type: "water", loggedAt: { gte: dayStart, lt: dayEnd } },
      _sum: { value: true },
    });

    if ((water._sum.value || 0) >= goal) streak++;
    else break;
  }

  return streak;
}

async function getWorkoutWeekProgress(userId: string): Promise<{ done: number; goal: number }> {
  const profile = await db.healthProfile.findUnique({ where: { userId } });
  if (!profile) return { done: 0, goal: 3 };

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const count = await db.healthLog.count({
    where: { userId, type: "workout", loggedAt: { gte: startOfWeek } },
  });

  return { done: count, goal: profile.workoutGoalPerWeek };
}

async function getTaskCompletionStreak(userId: string): Promise<number> {
  return getDailyStreak(userId, async (dayStart, dayEnd) => {
    const count = await db.task.count({
      where: { userId, status: "done", completedAt: { gte: dayStart, lt: dayEnd } },
    });
    return count > 0;
  });
}

async function getActionCompletionStreak(userId: string): Promise<number> {
  return getDailyStreak(userId, async (dayStart, dayEnd) => {
    const count = await db.aiAction.count({
      where: { userId, status: "done", completedAt: { gte: dayStart, lt: dayEnd } },
    });
    return count > 0;
  });
}

async function getDailyStreak(
  userId: string,
  checkDay: (dayStart: Date, dayEnd: Date) => Promise<boolean>
): Promise<number> {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 30; i++) {
    const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    if (await checkDay(dayStart, dayEnd)) streak++;
    else break;
  }

  return streak;
}
