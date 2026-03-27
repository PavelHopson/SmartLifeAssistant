import { db } from "@/lib/db";
import type { HealthLogView, HealthLogType, HealthDashboard } from "@/lib/domain/types";

export async function addHealthLog(
  userId: string,
  data: { type: HealthLogType; value: number; unit: string; note?: string; loggedAt?: Date }
): Promise<HealthLogView> {
  const log = await db.healthLog.create({
    data: {
      userId,
      type: data.type,
      value: data.value,
      unit: data.unit,
      note: data.note || null,
      loggedAt: data.loggedAt || new Date(),
    },
  });

  return mapLog(log);
}

export async function getRecentLogs(
  userId: string,
  type?: HealthLogType,
  limit = 20
): Promise<HealthLogView[]> {
  const logs = await db.healthLog.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: { loggedAt: "desc" },
    take: limit,
  });

  return logs.map(mapLog);
}

export async function deleteHealthLog(userId: string, logId: string): Promise<boolean> {
  const log = await db.healthLog.findFirst({ where: { id: logId, userId } });
  if (!log) return false;
  await db.healthLog.delete({ where: { id: logId } });
  return true;
}

export async function getHealthDashboard(userId: string): Promise<HealthDashboard> {
  const profile = await db.healthProfile.findUnique({ where: { userId } });
  if (!profile) {
    return {
      hasProfile: false,
      workoutsThisWeek: 0,
      workoutGoal: 3,
      waterToday: 0,
      waterGoal: 8,
      lastSleepHours: null,
      sleepGoal: 8,
      pendingHealthActions: 0,
    };
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [workoutsThisWeek, waterToday, lastSleep, pendingHealthActions] = await Promise.all([
    db.healthLog.count({
      where: { userId, type: "workout", loggedAt: { gte: startOfWeek } },
    }),
    db.healthLog.aggregate({
      where: { userId, type: "water", loggedAt: { gte: startOfToday } },
      _sum: { value: true },
    }),
    db.healthLog.findFirst({
      where: { userId, type: "sleep" },
      orderBy: { loggedAt: "desc" },
      select: { value: true },
    }),
    db.aiAction.count({
      where: {
        userId,
        kind: { startsWith: "health_" },
        status: { in: ["pending_user", "confirmed"] },
      },
    }),
  ]);

  return {
    hasProfile: true,
    workoutsThisWeek,
    workoutGoal: profile.workoutGoalPerWeek,
    waterToday: waterToday._sum.value || 0,
    waterGoal: profile.waterGoalPerDay,
    lastSleepHours: lastSleep?.value || null,
    sleepGoal: profile.sleepGoalHours,
    pendingHealthActions,
  };
}

function mapLog(log: { id: string; type: string; value: number; unit: string; note: string | null; loggedAt: Date }): HealthLogView {
  return {
    id: log.id,
    type: log.type as HealthLogType,
    value: log.value,
    unit: log.unit,
    note: log.note,
    loggedAt: log.loggedAt.toISOString(),
  };
}
