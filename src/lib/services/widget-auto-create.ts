import { db } from "@/lib/db";
import { getUserSettings } from "./settings";
import { trackEvent } from "./analytics";

// Auto-create widgets for high-priority items when enabled
export async function autoCreateWidgets(userId: string): Promise<number> {
  const settings = await getUserSettings(userId);
  if (!settings.autoCreateWidgets) return 0;

  // Get tasks that should have widgets
  const eligibleTasks = await db.task.findMany({
    where: {
      userId,
      status: { in: ["open", "in_progress"] },
      widgetEligible: true,
      priority: { lte: 1 }, // urgent + high only
      widgets: { none: { visible: true } },
    },
    take: 4, // Don't spam
    orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
  });

  let created = 0;
  const existingWidgets = await db.widget.count({ where: { userId, visible: true } });

  for (const task of eligibleTasks) {
    if (existingWidgets + created >= 8) break; // Cap at 8 visible widgets

    const col = (existingWidgets + created) % 3;
    const row = Math.floor((existingWidgets + created) / 3);

    await db.widget.create({
      data: {
        userId,
        taskId: task.id,
        title: task.title,
        dueAt: task.dueAt,
        color: task.priority === 0 ? "#ef4444" : settings.defaultWidgetColor,
        positionX: 40 + col * 260,
        positionY: 40 + row * 180,
        popupEnabled: settings.popupReminders && task.priority === 0,
      },
    });

    await trackEvent({
      userId,
      eventType: "widget_created",
      entityType: "task",
      entityId: task.id,
      metadata: { autoCreated: true, priority: task.priority },
    });

    created++;
  }

  return created;
}
