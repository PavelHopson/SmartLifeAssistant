import { db } from "@/lib/db";
import type { HealthProfileView, HealthGoal, ActivityLevel } from "@/lib/domain/types";

const DEFAULTS: HealthProfileView = {
  goal: "general_health",
  activityLevel: "medium",
  workoutGoalPerWeek: 3,
  waterGoalPerDay: 8,
  sleepGoalHours: 8,
  reminderEnabled: true,
};

export async function getHealthProfile(userId: string): Promise<HealthProfileView | null> {
  const profile = await db.healthProfile.findUnique({ where: { userId } });
  if (!profile) return null;

  return {
    goal: profile.goal as HealthGoal,
    activityLevel: profile.activityLevel as ActivityLevel,
    workoutGoalPerWeek: profile.workoutGoalPerWeek,
    waterGoalPerDay: profile.waterGoalPerDay,
    sleepGoalHours: profile.sleepGoalHours,
    reminderEnabled: profile.reminderEnabled,
  };
}

export async function upsertHealthProfile(
  userId: string,
  data: Partial<HealthProfileView>
): Promise<HealthProfileView> {
  const profile = await db.healthProfile.upsert({
    where: { userId },
    create: { userId, ...DEFAULTS, ...data },
    update: data,
  });

  return {
    goal: profile.goal as HealthGoal,
    activityLevel: profile.activityLevel as ActivityLevel,
    workoutGoalPerWeek: profile.workoutGoalPerWeek,
    waterGoalPerDay: profile.waterGoalPerDay,
    sleepGoalHours: profile.sleepGoalHours,
    reminderEnabled: profile.reminderEnabled,
  };
}
