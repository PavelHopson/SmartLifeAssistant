import { db } from "@/lib/db";

export interface ExperimentResult {
  experimentName: string;
  variants: VariantResult[];
}

export interface VariantResult {
  variant: string;
  assignments: number;
  remindersSent: number;
  remindersActedOn: number;
  completionsAfterReminder: number;
  conversionRate: number;
}

export async function getExperimentResults(): Promise<ExperimentResult[]> {
  const assignments = await db.experimentAssignment.findMany({
    orderBy: { experimentName: "asc" },
  });

  const experimentMap = new Map<string, Map<string, string[]>>();
  for (const a of assignments) {
    if (!experimentMap.has(a.experimentName)) {
      experimentMap.set(a.experimentName, new Map());
    }
    const variantMap = experimentMap.get(a.experimentName)!;
    if (!variantMap.has(a.variant)) {
      variantMap.set(a.variant, []);
    }
    variantMap.get(a.variant)!.push(a.userId);
  }

  const results: ExperimentResult[] = [];

  for (const [experimentName, variantMap] of experimentMap) {
    const variants: VariantResult[] = [];

    for (const [variant, userIds] of variantMap) {
      const [remindersSent, remindersActedOn, completions] = await Promise.all([
        db.analyticsEvent.count({
          where: { userId: { in: userIds }, eventType: "reminder_sent" },
        }),
        db.analyticsEvent.count({
          where: { userId: { in: userIds }, eventType: "notification_opened" },
        }),
        db.analyticsEvent.count({
          where: {
            userId: { in: userIds },
            eventType: { in: ["task_completed", "action_completed"] },
          },
        }),
      ]);

      variants.push({
        variant,
        assignments: userIds.length,
        remindersSent,
        remindersActedOn,
        completionsAfterReminder: completions,
        conversionRate: remindersSent > 0 ? completions / remindersSent : 0,
      });
    }

    results.push({ experimentName, variants });
  }

  return results;
}
