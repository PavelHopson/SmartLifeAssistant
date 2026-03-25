import { db } from "@/lib/db";

export interface UserSettings {
  // Notifications
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  // Dashboard
  showAiSummary: boolean;
  summaryStyle: "concise" | "detailed";
  enableLlm: boolean;
  // Widgets
  autoCreateWidgets: boolean;
  defaultWidgetColor: string;
  popupReminders: boolean;
  overdueHighlight: boolean;
  // Reminders
  dueSoonReminders: boolean;
  overdueReminders: boolean;
  staleActionReminders: boolean;
  defaultSnoozeMins: number;
}

const DEFAULTS: UserSettings = {
  inAppEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
  showAiSummary: true,
  summaryStyle: "concise",
  enableLlm: false,
  autoCreateWidgets: true,
  defaultWidgetColor: "#3b82f6",
  popupReminders: true,
  overdueHighlight: true,
  dueSoonReminders: true,
  overdueReminders: true,
  staleActionReminders: true,
  defaultSnoozeMins: 1440,
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const pref = await db.notificationPreference.findUnique({
    where: { userId },
  });

  if (!pref) return DEFAULTS;

  return {
    inAppEnabled: pref.inAppEnabled,
    emailEnabled: pref.emailEnabled,
    smsEnabled: pref.smsEnabled,
    quietHoursStart: pref.quietHoursStart,
    quietHoursEnd: pref.quietHoursEnd,
    showAiSummary: pref.showAiSummary,
    summaryStyle: pref.summaryStyle as "concise" | "detailed",
    enableLlm: pref.enableLlm,
    autoCreateWidgets: pref.autoCreateWidgets,
    defaultWidgetColor: pref.defaultWidgetColor,
    popupReminders: pref.popupReminders,
    overdueHighlight: pref.overdueHighlight,
    dueSoonReminders: pref.dueSoonReminders,
    overdueReminders: pref.overdueReminders,
    staleActionReminders: pref.staleActionReminders,
    defaultSnoozeMins: pref.defaultSnoozeMins,
  };
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<UserSettings>
) {
  return db.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...updates },
    update: updates,
  });
}
