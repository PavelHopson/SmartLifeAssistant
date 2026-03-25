import { db } from "@/lib/db";
import { getUserSettings } from "./settings";

export interface DashboardSummary {
  greeting: string;
  items: SummaryItem[];
  nextStep: string;
  nextStepHref: string;
}

interface SummaryItem {
  icon: "savings" | "task" | "action" | "reminder" | "check";
  text: string;
  priority: number;
}

export async function generateDashboardSummary(userId: string): Promise<DashboardSummary> {
  const now = new Date();
  const settings = await getUserSettings(userId);
  const items: SummaryItem[] = [];

  const [
    savingsResult,
    overdueTasks,
    dueToday,
    pendingActions,
    manualSteps,
    doneActions,
    unread,
    widgetCompletions,
  ] = await Promise.all([
    db.subscription.aggregate({
      where: { userId, potentialSaving: { not: null } },
      _sum: { potentialSaving: true },
    }),
    db.task.count({
      where: { userId, status: { in: ["open", "in_progress"] }, dueAt: { lt: now } },
    }),
    db.task.count({
      where: {
        userId,
        status: { in: ["open", "in_progress"] },
        dueAt: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      },
    }),
    db.aiAction.count({ where: { userId, status: "pending_user" } }),
    db.aiAction.count({ where: { userId, status: "requires_manual_step" } }),
    db.aiAction.count({ where: { userId, status: "done" } }),
    db.notification.count({ where: { userId, channel: "in_app", readAt: null, status: "sent" } }),
    db.analyticsEvent.count({
      where: { userId, eventType: "widget_completed_from_surface" },
    }),
  ]);

  const savings = savingsResult._sum.potentialSaving || 0;

  // Priority scoring: overdue manual steps > overdue tasks > pending actions > savings > completions
  if (manualSteps > 0) {
    items.push({
      icon: "action",
      text: `${manualSteps} action${manualSteps > 1 ? "s" : ""} need${manualSteps === 1 ? "s" : ""} manual completion`,
      priority: -1,
    });
  }

  if (overdueTasks > 0) {
    items.push({
      icon: "task",
      text: `${overdueTasks} task${overdueTasks > 1 ? "s" : ""} overdue`,
      priority: 0,
    });
  }

  if (savings > 0) {
    items.push({
      icon: "savings",
      text: `You can save £${Math.round(savings * 100) / 100}/year`,
      priority: pendingActions > 0 ? 1 : 0, // Higher if actions are pending
    });
  }

  if (dueToday > 0) {
    items.push({
      icon: "task",
      text: `${dueToday} task${dueToday > 1 ? "s" : ""} due today`,
      priority: 1,
    });
  }

  if (pendingActions > 0) {
    items.push({
      icon: "action",
      text: `${pendingActions} action${pendingActions > 1 ? "s" : ""} waiting for confirmation`,
      priority: 1,
    });
  }

  if (doneActions > 0) {
    items.push({
      icon: "check",
      text: `${doneActions} action${doneActions > 1 ? "s" : ""} completed`,
      priority: 3,
    });
  }

  // Personalization: if user completes via widgets, mention it
  if (widgetCompletions > 2 && settings.autoCreateWidgets) {
    items.push({
      icon: "check",
      text: `${widgetCompletions} tasks completed from widgets`,
      priority: 4,
    });
  }

  if (unread > 0) {
    items.push({
      icon: "reminder",
      text: `${unread} unread notification${unread > 1 ? "s" : ""}`,
      priority: 2,
    });
  }

  items.sort((a, b) => a.priority - b.priority);

  // Next step + href — deterministic priority
  let nextStep = "You're all caught up!";
  let nextStepHref = "/dashboard";

  if (manualSteps > 0) {
    nextStep = "Complete the manual steps for your actions";
    nextStepHref = "/tasks";
  } else if (overdueTasks > 0) {
    nextStep = "Handle your overdue tasks";
    nextStepHref = "/tasks";
  } else if (pendingActions > 0) {
    nextStep = "Review and confirm your pending actions";
    nextStepHref = "/actions";
  } else if (dueToday > 0) {
    nextStep = "Complete tasks due today";
    nextStepHref = "/tasks";
  } else if (savings > 0) {
    nextStep = "Fix unused subscriptions to start saving";
    nextStepHref = "/actions";
  }

  const hour = now.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const maxItems = settings.summaryStyle === "detailed" ? 5 : 3;
  const base: DashboardSummary = {
    greeting,
    items: items.slice(0, maxItems),
    nextStep,
    nextStepHref,
  };

  // Optional LLM enhancement
  if (settings.enableLlm && process.env.ANTHROPIC_API_KEY) {
    const { createLLMProvider } = await import("./summary-llm");
    const llm = createLLMProvider();
    const enhanced = await llm.enhance(base);
    return { ...enhanced, nextStepHref } as DashboardSummary;
  }

  return base;
}
