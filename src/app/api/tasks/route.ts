import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getTasks, createTask, completeTask, updateTaskStatus, togglePin, deleteTask, getTaskStats } from "@/lib/services/tasks";
import { snoozeTask } from "@/lib/services/reminders";
import type { TaskStatus } from "@/lib/services/tasks";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as TaskStatus | null;

  const [tasks, stats] = await Promise.all([
    getTasks(userId, status || undefined),
    getTaskStats(userId),
  ]);

  return NextResponse.json({ tasks, stats });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();

  if (body.action === "complete" && body.taskId) {
    const task = await completeTask(body.taskId, userId);
    return NextResponse.json({ task });
  }

  if (body.action === "status" && body.taskId && body.status) {
    const task = await updateTaskStatus(body.taskId, userId, body.status);
    return NextResponse.json({ task });
  }

  if (body.action === "pin" && body.taskId) {
    const task = await togglePin(body.taskId, userId);
    return NextResponse.json({ task });
  }

  if (body.action === "snooze" && body.taskId && body.until) {
    const task = await snoozeTask(body.taskId, userId, new Date(body.until));
    return NextResponse.json({ task });
  }

  if (body.action === "delete" && body.taskId) {
    await deleteTask(body.taskId, userId);
    return NextResponse.json({ deleted: true });
  }

  // Create new task
  const task = await createTask({
    userId,
    title: body.title,
    description: body.description,
    priority: body.priority,
    dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
  });

  return NextResponse.json({ task });
}
