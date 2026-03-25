import { db } from "@/lib/db";

export type TaskStatus = "open" | "in_progress" | "done" | "archived";

interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  priority?: number;
  dueAt?: Date;
  sourceType?: string;
  sourceId?: string;
  aiGenerated?: boolean;
}

export async function createTask(input: CreateTaskInput) {
  return db.task.create({
    data: {
      userId: input.userId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? 1,
      dueAt: input.dueAt,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      aiGenerated: input.aiGenerated ?? false,
    },
  });
}

export async function getTasks(userId: string, status?: TaskStatus) {
  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  return db.task.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function completeTask(taskId: string, userId: string) {
  return db.task.update({
    where: { id: taskId, userId },
    data: { status: "done", completedAt: new Date() },
  });
}

export async function updateTaskStatus(taskId: string, userId: string, status: TaskStatus) {
  return db.task.update({
    where: { id: taskId, userId },
    data: {
      status,
      completedAt: status === "done" ? new Date() : null,
    },
  });
}

export async function togglePin(taskId: string, userId: string) {
  const task = await db.task.findUniqueOrThrow({ where: { id: taskId, userId } });
  return db.task.update({
    where: { id: taskId },
    data: { pinned: !task.pinned },
  });
}

export async function deleteTask(taskId: string, userId: string) {
  return db.task.delete({ where: { id: taskId, userId } });
}

export async function getTaskStats(userId: string) {
  const [total, open, inProgress, done] = await Promise.all([
    db.task.count({ where: { userId, status: { not: "archived" } } }),
    db.task.count({ where: { userId, status: "open" } }),
    db.task.count({ where: { userId, status: "in_progress" } }),
    db.task.count({ where: { userId, status: "done" } }),
  ]);
  return { total, open, inProgress, done };
}

// Create a task from a manual-step action execution fallback
export async function createTaskFromManualStep(
  userId: string,
  actionId: string,
  label: string,
  url?: string
) {
  return db.task.create({
    data: {
      userId,
      title: label,
      description: url ? `Complete at: ${url}` : undefined,
      sourceType: "ai_action",
      sourceId: actionId,
      aiGenerated: true,
      priority: 0,
    },
  });
}
