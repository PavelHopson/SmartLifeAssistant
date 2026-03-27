import { db } from "@/lib/db";

export type EventType =
  | "bank_connected"
  | "transactions_synced"
  | "subscriptions_detected"
  | "actions_generated"
  | "action_confirmed"
  | "action_executed"
  | "action_completed"
  | "task_created"
  | "task_completed"
  | "reminder_sent"
  | "notification_opened"
  | "wow_seen"
  | "share_card_used"
  | "widget_created"
  | "widget_completed_from_surface"
  | "onboarding_step"
  | "health_profile_created"
  | "health_goal_updated"
  | "health_log_added"
  | "health_action_generated"
  | "health_action_completed"
  | "health_widget_created"
  | "health_reminder_sent"
  | "action_viewed"
  | "action_guided_flow_opened"
  | "action_marked_done"
  | "action_snoozed"
  | "action_converted_to_task"
  | "action_pinned_to_widget"
  | "completion_feedback_seen"
  | "daily_focus_clicked"
  | "money_action_completed"
  | "health_action_completed_v2"
  | "guided_flow_started"
  | "guided_flow_completed"
  | "guided_flow_abandoned"
  | "health_action_auto_generated"
  | "streak_seen"
  | "streak_extended"
  | "reminder_followup_sent"
  | "desktop_notification_clicked"
  | "daily_focus_completed"
  | "daily_focus_deferred"
  | "end_of_day_summary_generated"
  | "end_of_day_summary_sent"
  | "end_of_day_summary_opened"
  | "desktop_notification_routed"
  | "daily_focus_cached"
  | "daily_focus_refreshed"
  | "streak_viewed"
  | "guided_flow_resumed"
  | "reminder_reentry_opened"
  | "pricing_viewed"
  | "upgrade_cta_clicked"
  | "premium_gate_seen"
  | "premium_gate_dismissed"
  | "trial_started"
  | "upgrade_started"
  | "upgrade_completed"
  | "wow_to_pricing_click"
  | "dashboard_upgrade_click"
  | "locked_feature_viewed"
  | "autopilot_cta_clicked"
  | "execute_all_premium_gate"
  | "wow_upgrade_clicked"
  | "dashboard_upgrade_clicked"
  | "action_upgrade_clicked"
  | "stripe_checkout_started"
  | "stripe_checkout_completed"
  | "autopilot_conversion"
  | "execute_blocked_conversion"
  | "post_completion_conversion"
  | "referral_link_copied"
  | "referral_link_shared"
  | "referral_signup"
  | "referral_activated"
  | "referral_converted"
  | "feedback_submitted"
  | "share_trigger_shown"
  | "share_trigger_clicked"
  | "share_trigger_dismissed"
  | "onboarding_value_preview_seen";

interface TrackOptions {
  userId: string;
  eventType: EventType;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(options: TrackOptions) {
  return db.analyticsEvent.create({
    data: {
      userId: options.userId,
      eventType: options.eventType,
      entityType: options.entityType,
      entityId: options.entityId,
      metadata: options.metadata
        ? JSON.parse(JSON.stringify(options.metadata))
        : undefined,
    },
  });
}

// Time from first event to wow_seen
export async function getTimeToWow(userId: string): Promise<number | null> {
  const first = await db.analyticsEvent.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  const wow = await db.analyticsEvent.findFirst({
    where: { userId, eventType: "wow_seen" },
    select: { createdAt: true },
  });

  if (!first || !wow) return null;
  return wow.createdAt.getTime() - first.createdAt.getTime();
}

// Time to first completed action
export async function getTimeToFirstAction(userId: string): Promise<number | null> {
  const first = await db.analyticsEvent.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  const action = await db.analyticsEvent.findFirst({
    where: { userId, eventType: "action_completed" },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  if (!first || !action) return null;
  return action.createdAt.getTime() - first.createdAt.getTime();
}

// Action completion rate
export async function getCompletionRate(userId: string) {
  const generated = await db.analyticsEvent.count({
    where: { userId, eventType: "actions_generated" },
  });
  const completed = await db.analyticsEvent.count({
    where: { userId, eventType: "action_completed" },
  });
  return generated > 0 ? completed / generated : 0;
}

// Reminder effectiveness: reminders sent vs tasks completed within 24h of reminder
export async function getReminderEffectiveness(userId: string) {
  const reminders = await db.analyticsEvent.count({
    where: { userId, eventType: "reminder_sent" },
  });
  const completions = await db.analyticsEvent.count({
    where: { userId, eventType: "task_completed" },
  });
  return { reminders, completions, rate: reminders > 0 ? completions / reminders : 0 };
}

// Widget usage stats
export async function getWidgetStats(userId: string) {
  const created = await db.analyticsEvent.count({
    where: { userId, eventType: "widget_created" },
  });
  const completedFromWidget = await db.analyticsEvent.count({
    where: { userId, eventType: "widget_completed_from_surface" },
  });
  return { created, completedFromWidget };
}

// Recent events for debug/admin view
export async function getRecentEvents(userId?: string, limit = 50) {
  return db.analyticsEvent.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
