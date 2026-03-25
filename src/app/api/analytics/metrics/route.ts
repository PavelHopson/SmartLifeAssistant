import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import {
  getTimeToWow,
  getTimeToFirstAction,
  getCompletionRate,
  getReminderEffectiveness,
  getWidgetStats,
} from "@/lib/services/analytics";

export async function GET() {
  const userId = await getCurrentUserId();

  const [timeToWow, timeToFirstAction, completionRate, reminderEff, widgetStats] =
    await Promise.all([
      getTimeToWow(userId),
      getTimeToFirstAction(userId),
      getCompletionRate(userId),
      getReminderEffectiveness(userId),
      getWidgetStats(userId),
    ]);

  return NextResponse.json({
    timeToWowMs: timeToWow,
    timeToFirstActionMs: timeToFirstAction,
    completionRate,
    reminders: reminderEff,
    widgets: widgetStats,
  });
}
