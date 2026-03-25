import { db } from "@/lib/db";
import { createEmailProvider, renderEmailTemplate } from "./email-provider";

export type NotificationEventType =
  | "action_generated"
  | "action_confirmed"
  | "action_requires_manual_step"
  | "action_completed"
  | "savings_detected"
  | "reminder_due";

export type NotificationChannel = "in_app" | "email" | "sms" | "push";

interface CreateNotificationInput {
  userId: string;
  type: NotificationEventType;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  scheduledFor?: Date;
  payload?: Record<string, unknown>;
}

const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function sendNotification(input: CreateNotificationInput) {
  const prefs = await db.notificationPreference.findUnique({
    where: { userId: input.userId },
  });

  const channels: NotificationChannel[] = ["in_app"];
  if (prefs?.emailEnabled !== false) channels.push("email");

  const notifications = [];

  for (const channel of channels) {
    const notification = await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        channel,
        status: "pending",
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        scheduledFor: input.scheduledFor,
        payload: input.payload
          ? JSON.parse(JSON.stringify(input.payload))
          : undefined,
      },
    });

    await dispatchNotification(notification.id, channel, input);
    notifications.push(notification);
  }

  return notifications;
}

async function dispatchNotification(
  notificationId: string,
  channel: NotificationChannel,
  input: CreateNotificationInput
) {
  if (channel === "in_app") {
    await db.notification.update({
      where: { id: notificationId },
      data: { status: "sent", sentAt: new Date() },
    });
    return;
  }

  if (channel === "email") {
    const success = await sendEmailNotification(input);
    await db.notification.update({
      where: { id: notificationId },
      data: {
        status: success ? "sent" : "failed",
        sentAt: success ? new Date() : undefined,
      },
    });
    return;
  }

  // sms/push: stub
  await db.notification.update({
    where: { id: notificationId },
    data: { status: "pending" },
  });
}

async function sendEmailNotification(input: CreateNotificationInput): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: input.userId } });
  if (!user?.email) return false;

  const provider = createEmailProvider();
  const template = renderEmailTemplate(input.type, {
    title: input.title,
    body: input.body,
    appUrl,
    ...(input.payload as Record<string, string | number> || {}),
  });

  return provider.send(user.email, template.subject, template.html);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, channel: "in_app", readAt: null, status: "sent" },
  });
}

export async function getNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
) {
  const where: Record<string, unknown> = { userId, channel: "in_app" };
  if (options?.unreadOnly) where.readAt = null;

  return db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
  });
}

export async function markAsRead(userId: string, notificationIds: string[]) {
  return db.notification.updateMany({
    where: { id: { in: notificationIds }, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, channel: "in_app", readAt: null },
    data: { readAt: new Date() },
  });
}
