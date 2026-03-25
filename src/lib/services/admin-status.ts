import { db } from "@/lib/db";

export interface AdminStatus {
  jobs: {
    recentRuns: { id: string; type: string; status: string; durationMs: number | null; errorMessage: string | null; completedAt: string | null }[];
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
  };
  actions: {
    recentFailures: { id: string; title: string; kind: string; status: string; updatedAt: string }[];
    byStatus: Record<string, number>;
  };
  notifications: {
    recentFailures: { id: string; title: string; channel: string; status: string; createdAt: string }[];
    sendCounts: { sent: number; failed: number; pending: number };
  };
  providers: {
    connections: { provider: string; status: string; count: number }[];
  };
  analytics: {
    wowConversion: number;
    actionCompletionRate: number;
    reminderEffectiveness: number;
    totalUsers: number;
    activeUsers7d: number;
  };
}

export async function getAdminStatus(): Promise<AdminStatus> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Jobs
  const [recentJobs, jobStatusCounts, jobTypeCounts] = await Promise.all([
    db.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, type: true, status: true, durationMs: true, errorMessage: true, completedAt: true },
    }),
    db.job.groupBy({ by: ["status"], _count: true }),
    db.job.groupBy({ by: ["type"], _count: true }),
  ]);

  const lastSuccess = recentJobs.find((j) => j.status === "done")?.completedAt;
  const lastFailure = recentJobs.find((j) => j.status === "failed")?.completedAt;

  // Actions
  const [recentActionFailures, actionStatusCounts] = await Promise.all([
    db.aiAction.findMany({
      where: { status: { in: ["failed", "expired"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, title: true, kind: true, status: true, updatedAt: true },
    }),
    db.aiAction.groupBy({ by: ["status"], _count: true }),
  ]);

  // Notifications
  const [recentNotifFailures, notifStatusCounts] = await Promise.all([
    db.notification.findMany({
      where: { status: "failed" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, channel: true, status: true, createdAt: true },
    }),
    db.notification.groupBy({ by: ["status"], _count: true }),
  ]);

  const notifCounts = { sent: 0, failed: 0, pending: 0 };
  for (const r of notifStatusCounts) {
    if (r.status === "sent" || r.status === "read") notifCounts.sent += r._count;
    else if (r.status === "failed") notifCounts.failed = r._count;
    else if (r.status === "pending") notifCounts.pending = r._count;
  }

  // Providers
  const providerConnections = await db.providerConnection.groupBy({
    by: ["provider", "status"],
    _count: true,
  });

  // Analytics highlights
  const [totalUsers, activeUsers, wowEvents, actionGenEvents, actionCompleteEvents, reminderEvents, completionAfterReminder] = await Promise.all([
    db.user.count(),
    db.analyticsEvent.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.analyticsEvent.count({ where: { eventType: "wow_seen" } }),
    db.analyticsEvent.count({ where: { eventType: "actions_generated" } }),
    db.analyticsEvent.count({ where: { eventType: "action_completed" } }),
    db.analyticsEvent.count({ where: { eventType: "reminder_sent" } }),
    db.analyticsEvent.count({ where: { eventType: "task_completed" } }),
  ]);

  return {
    jobs: {
      recentRuns: recentJobs.map((j) => ({
        ...j,
        completedAt: j.completedAt?.toISOString() || null,
      })),
      byStatus: Object.fromEntries(jobStatusCounts.map((r) => [r.status, r._count])),
      byType: Object.fromEntries(jobTypeCounts.map((r) => [r.type, r._count])),
      lastSuccessAt: lastSuccess?.toISOString() || null,
      lastFailureAt: lastFailure?.toISOString() || null,
    },
    actions: {
      recentFailures: recentActionFailures.map((a) => ({
        ...a,
        updatedAt: a.updatedAt.toISOString(),
      })),
      byStatus: Object.fromEntries(actionStatusCounts.map((r) => [r.status, r._count])),
    },
    notifications: {
      recentFailures: recentNotifFailures.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      sendCounts: notifCounts,
    },
    providers: {
      connections: providerConnections.map((r) => ({
        provider: r.provider,
        status: r.status,
        count: r._count,
      })),
    },
    analytics: {
      wowConversion: actionGenEvents > 0 ? wowEvents / actionGenEvents : 0,
      actionCompletionRate: actionGenEvents > 0 ? actionCompleteEvents / actionGenEvents : 0,
      reminderEffectiveness: reminderEvents > 0 ? completionAfterReminder / reminderEvents : 0,
      totalUsers,
      activeUsers7d: activeUsers.length,
    },
  };
}
