import { db } from "@/lib/db";
import { sendNotification } from "./notifications";

// Scan for due/overdue tasks and create reminder notifications
export async function scanDueTasks(userId: string): Promise<number> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);

  let reminders = 0;

  // Overdue tasks
  const overdue = await db.task.findMany({
    where: {
      userId,
      status: { in: ["open", "in_progress"] },
      dueAt: { lt: now },
      snoozedUntil: { not: now, lt: now }, // not actively snoozed
    },
  });

  for (const task of overdue) {
    if (task.reminderSentAt && now.getTime() - task.reminderSentAt.getTime() < 12 * 60 * 60 * 1000) {
      continue; // Don't re-remind within 12h
    }

    await sendNotification({
      userId,
      type: "reminder_due",
      title: "Task overdue",
      body: `"${task.title}" is overdue. Complete it now or snooze.`,
      relatedEntityType: "task",
      relatedEntityId: task.id,
    });

    await db.task.update({
      where: { id: task.id },
      data: { reminderSentAt: now },
    });
    reminders++;
  }

  // Due in 1h
  const dueSoon = await db.task.findMany({
    where: {
      userId,
      status: { in: ["open", "in_progress"] },
      dueAt: { gt: now, lte: in1h },
      reminderSentAt: null,
    },
  });

  for (const task of dueSoon) {
    await sendNotification({
      userId,
      type: "reminder_due",
      title: "Task due in 1 hour",
      body: `"${task.title}" is due soon.`,
      relatedEntityType: "task",
      relatedEntityId: task.id,
    });

    await db.task.update({
      where: { id: task.id },
      data: { reminderSentAt: now },
    });
    reminders++;
  }

  // Due in 24h (only if no reminder sent yet)
  const dueIn24h = await db.task.findMany({
    where: {
      userId,
      status: { in: ["open", "in_progress"] },
      dueAt: { gt: in1h, lte: in24h },
      reminderSentAt: null,
    },
  });

  for (const task of dueIn24h) {
    await sendNotification({
      userId,
      type: "reminder_due",
      title: "Task due tomorrow",
      body: `"${task.title}" is due within 24 hours.`,
      relatedEntityType: "task",
      relatedEntityId: task.id,
    });

    await db.task.update({
      where: { id: task.id },
      data: { reminderSentAt: now },
    });
    reminders++;
  }

  // Pending actions too long (>48h)
  const staleActions = await db.aiAction.findMany({
    where: {
      userId,
      status: "pending_user",
      createdAt: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
    },
  });

  for (const action of staleActions) {
    // Check if we already reminded about this action recently
    const recentReminder = await db.notification.findFirst({
      where: {
        userId,
        type: "reminder_due",
        relatedEntityType: "ai_action",
        relatedEntityId: action.id,
        createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!recentReminder) {
      await sendNotification({
        userId,
        type: "reminder_due",
        title: "Action waiting for you",
        body: `"${action.title}" has been pending for over 2 days. Confirm or dismiss it.`,
        relatedEntityType: "ai_action",
        relatedEntityId: action.id,
      });
      reminders++;
    }
  }

  // Manual-step follow-up (>24h since requires_manual_step)
  const manualStepActions = await db.aiAction.findMany({
    where: {
      userId,
      status: "requires_manual_step",
      updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
  });

  for (const action of manualStepActions) {
    const recentReminder = await db.notification.findFirst({
      where: {
        userId,
        type: "reminder_due",
        relatedEntityType: "ai_action",
        relatedEntityId: action.id,
        createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!recentReminder) {
      await sendNotification({
        userId,
        type: "action_requires_manual_step",
        title: "Manual step reminder",
        body: `"${action.title}" still needs your attention. Complete the manual step.`,
        relatedEntityType: "ai_action",
        relatedEntityId: action.id,
      });
      reminders++;
    }
  }

  return reminders;
}

// Snooze a task
export async function snoozeTask(taskId: string, userId: string, until: Date) {
  return db.task.update({
    where: { id: taskId, userId },
    data: {
      snoozedUntil: until,
      reminderSentAt: null, // reset so we remind again after snooze
    },
  });
}
