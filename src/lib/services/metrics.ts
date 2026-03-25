import { db } from "@/lib/db";

export interface ProductMetrics {
  annualSavingsFromCompleted: number;
  pendingActionsCount: number;
  overdueTasksCount: number;
  unreadNotificationsCount: number;
  totalTasksDone: number;
  totalActionsDone: number;
}

export async function getProductMetrics(userId: string): Promise<ProductMetrics> {
  const now = new Date();

  const [
    completedSavings,
    pendingActions,
    overdueTasks,
    unreadNotifications,
    tasksDone,
    actionsDone,
  ] = await Promise.all([
    db.aiAction.aggregate({
      where: { userId, status: "done", impactAmount: { not: null } },
      _sum: { impactAmount: true },
    }),
    db.aiAction.count({ where: { userId, status: "pending_user" } }),
    db.task.count({
      where: { userId, status: { in: ["open", "in_progress"] }, dueAt: { lt: now } },
    }),
    db.notification.count({
      where: { userId, channel: "in_app", readAt: null, status: "sent" },
    }),
    db.task.count({ where: { userId, status: "done" } }),
    db.aiAction.count({ where: { userId, status: "done" } }),
  ]);

  return {
    annualSavingsFromCompleted: completedSavings._sum.impactAmount || 0,
    pendingActionsCount: pendingActions,
    overdueTasksCount: overdueTasks,
    unreadNotificationsCount: unreadNotifications,
    totalTasksDone: tasksDone,
    totalActionsDone: actionsDone,
  };
}
