import { db } from "@/lib/db";
import { getUserStreaks, type StreakInfo } from "./streaks";

// In-memory cache per user for daily focus stability
const focusCache = new Map<string, { data: DailyFocus; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface FocusItem {
  type: "money" | "health" | "task" | "reminder";
  kind: string;
  title: string;
  subtitle: string;
  impact: string | null;
  href: string;
  entityId: string | null;
  priority: number;
}

export interface DailyFocus {
  items: FocusItem[];
  primaryAction: FocusItem | null;
  completedToday: number;
  totalSavings: number;
  bestStreak: StreakInfo | null;
  generatedAt: string;
}

const HEALTH_KINDS = new Set(["health_workout", "health_walk", "health_hydration", "health_sleep"]);

export async function getDailyFocus(userId: string, forceRefresh = false): Promise<DailyFocus> {
  // Check cache first
  if (!forceRefresh) {
    const cached = focusCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  return computeAndCacheDailyFocus(userId);
}

// Invalidate cache (call when action/task/health changes)
export function invalidateDailyFocusCache(userId: string) {
  focusCache.delete(userId);
}

async function computeAndCacheDailyFocus(userId: string): Promise<DailyFocus> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Parallel queries for all focus sources
  const [pendingActions, overdueTasks, dueTodayTasks, completedToday, totalSavings] = await Promise.all([
    db.aiAction.findMany({
      where: { userId, status: { in: ["pending_user", "confirmed", "requires_manual_step"] } },
      orderBy: [{ priority: "asc" }, { impactAmount: "desc" }, { createdAt: "asc" }],
      take: 10,
    }),
    db.task.findMany({
      where: {
        userId,
        status: { in: ["open", "in_progress"] },
        dueAt: { lt: now },
      },
      orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
      take: 5,
    }),
    db.task.findMany({
      where: {
        userId,
        status: { in: ["open", "in_progress"] },
        dueAt: { gte: startOfDay, lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) },
      },
      take: 3,
    }),
    db.aiAction.count({
      where: { userId, status: "done", completedAt: { gte: startOfDay } },
    }),
    db.aiAction.aggregate({
      where: { userId, status: "done", impactAmount: { not: null } },
      _sum: { impactAmount: true },
    }),
  ]);

  const items: FocusItem[] = [];
  let moneyCount = 0;
  let healthCount = 0;

  // Add actions — balance money vs health (max 1 health, 1 money at top)
  for (const action of pendingActions) {
    const isHealth = HEALTH_KINDS.has(action.kind);

    if (isHealth && healthCount >= 1) continue;
    if (!isHealth && moneyCount >= 2) continue;

    if (isHealth) healthCount++;
    else moneyCount++;

    items.push({
      type: isHealth ? "health" : "money",
      kind: action.kind,
      title: action.title,
      subtitle: action.explanation || action.summary || "",
      impact: action.impactAmount ? `£${Math.round(action.impactAmount)}/yr` : null,
      href: "/actions",
      entityId: action.id,
      priority: action.priority,
    });
  }

  // Add overdue tasks (max 1)
  for (const task of overdueTasks.slice(0, 1)) {
    items.push({
      type: "task",
      kind: "overdue_task",
      title: task.title,
      subtitle: `Due ${task.dueAt!.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
      impact: null,
      href: "/tasks",
      entityId: task.id,
      priority: 0,
    });
  }

  // Add due-today tasks (max 1)
  for (const task of dueTodayTasks.slice(0, 1)) {
    if (items.length >= 4) break;
    items.push({
      type: "task",
      kind: "due_today",
      title: task.title,
      subtitle: "Due today",
      impact: null,
      href: "/tasks",
      entityId: task.id,
      priority: 1,
    });
  }

  // Sort by priority and cap at 4
  items.sort((a, b) => a.priority - b.priority);
  const focused = items.slice(0, 4);

  // Get streaks
  const { bestStreak } = await getUserStreaks(userId);

  const result: DailyFocus = {
    items: focused,
    primaryAction: focused[0] || null,
    completedToday,
    totalSavings: totalSavings._sum.impactAmount || 0,
    bestStreak,
    generatedAt: new Date().toISOString(),
  };

  // Cache result
  focusCache.set(userId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

  return result;
}
