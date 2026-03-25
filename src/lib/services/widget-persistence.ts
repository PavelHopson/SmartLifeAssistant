import { db } from "@/lib/db";

export interface WidgetData {
  id: string;
  taskId: string | null;
  title: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  locked: boolean;
  dueAt: string | null;
  status: string; // derived from linked task
}

export async function loadWidgets(userId: string): Promise<WidgetData[]> {
  const widgets = await db.widget.findMany({
    where: { userId, visible: true },
    include: { task: { select: { status: true } } },
    orderBy: { zIndex: "asc" },
  });

  return widgets.map((w) => ({
    id: w.id,
    taskId: w.taskId,
    title: w.title,
    color: w.color,
    x: w.positionX,
    y: w.positionY,
    width: w.width,
    height: w.height,
    pinned: w.pinned,
    locked: w.locked,
    dueAt: w.dueAt?.toISOString() || null,
    status: w.task?.status || "open",
  }));
}

export async function updateWidgetPosition(
  widgetId: string,
  userId: string,
  x: number,
  y: number
) {
  return db.widget.update({
    where: { id: widgetId, userId },
    data: { positionX: x, positionY: y },
  });
}

export async function updateWidgetProps(
  widgetId: string,
  userId: string,
  props: {
    pinned?: boolean;
    locked?: boolean;
    color?: string;
    visible?: boolean;
  }
) {
  return db.widget.update({
    where: { id: widgetId, userId },
    data: props,
  });
}

export async function completeWidgetTask(widgetId: string, userId: string) {
  const widget = await db.widget.findUnique({
    where: { id: widgetId, userId },
  });
  if (!widget) return null;

  // Complete linked task
  if (widget.taskId) {
    await db.task.update({
      where: { id: widget.taskId, userId },
      data: { status: "done", completedAt: new Date() },
    });
  }

  return widget;
}

export async function createWidgetFromTask(userId: string, taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId, userId } });
  if (!task) return null;

  return db.widget.create({
    data: {
      userId,
      taskId,
      title: task.title,
      dueAt: task.dueAt,
      color: task.priority === 0 ? "#ef4444" : task.priority === 1 ? "#f59e0b" : "#3b82f6",
    },
  });
}

export async function deleteWidget(widgetId: string, userId: string) {
  return db.widget.update({
    where: { id: widgetId, userId },
    data: { visible: false },
  });
}

// Seed default widgets from open tasks for first-time widget-lab visitors
export async function seedWidgetsFromTasks(userId: string): Promise<number> {
  const existingCount = await db.widget.count({ where: { userId, visible: true } });
  if (existingCount > 0) return 0;

  const tasks = await db.task.findMany({
    where: { userId, status: { in: ["open", "in_progress"] }, widgetEligible: true },
    take: 6,
    orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
  });

  let created = 0;
  for (let i = 0; i < tasks.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    await db.widget.create({
      data: {
        userId,
        taskId: tasks[i].id,
        title: tasks[i].title,
        dueAt: tasks[i].dueAt,
        color: tasks[i].priority === 0 ? "#ef4444" : tasks[i].priority === 1 ? "#f59e0b" : "#3b82f6",
        positionX: 40 + col * 260,
        positionY: 40 + row * 180,
      },
    });
    created++;
  }

  return created;
}
