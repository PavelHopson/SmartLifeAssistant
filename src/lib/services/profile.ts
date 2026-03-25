import { db } from "@/lib/db";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  authProvider: string | null;
  onboarding: {
    bankConnected: boolean;
    transactionsSynced: boolean;
    subscriptionsDetected: boolean;
    actionsGenerated: boolean;
    wowSeen: boolean;
    completed: boolean;
  };
  connectedProviders: { provider: string; status: string; accountCount: number }[];
  lastSyncAt: string | null;
  stats: {
    totalActions: number;
    completedActions: number;
    totalTasks: number;
    completedTasks: number;
    activeSubscriptions: number;
    widgetsCount: number;
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      authAccounts: { select: { provider: true } },
      providerConnections: {
        select: { provider: true, status: true, _count: { select: { accounts: true } } },
      },
    },
  });

  if (!user) return null;

  const [actionStats, taskStats, subCount, widgetCount, lastSync] = await Promise.all([
    db.aiAction.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    db.task.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    db.subscription.count({ where: { userId, status: "active" } }),
    db.widget.count({ where: { userId, visible: true } }),
    db.account.findFirst({
      where: { userId },
      orderBy: { lastSyncedAt: "desc" },
      select: { lastSyncedAt: true },
    }),
  ]);

  const totalActions = actionStats.reduce((s, r) => s + r._count, 0);
  const completedActions = actionStats.find((r) => r.status === "done")?._count || 0;
  const totalTasks = taskStats.reduce((s, r) => s + r._count, 0);
  const completedTasks = taskStats.find((r) => r.status === "done")?._count || 0;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    authProvider: user.authAccounts[0]?.provider || null,
    onboarding: {
      bankConnected: user.onboardingBankConnected,
      transactionsSynced: user.onboardingTransactionsSynced,
      subscriptionsDetected: user.onboardingSubscriptionsDetected,
      actionsGenerated: user.onboardingActionsGenerated,
      wowSeen: user.onboardingWowSeen,
      completed: !!user.onboardingCompletedAt,
    },
    connectedProviders: user.providerConnections.map((pc) => ({
      provider: pc.provider,
      status: pc.status,
      accountCount: pc._count.accounts,
    })),
    lastSyncAt: lastSync?.lastSyncedAt?.toISOString() || null,
    stats: {
      totalActions,
      completedActions,
      totalTasks,
      completedTasks,
      activeSubscriptions: subCount,
      widgetsCount: widgetCount,
    },
  };
}
