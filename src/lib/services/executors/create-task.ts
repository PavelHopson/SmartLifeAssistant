import { db } from "@/lib/db";
import type { ActionExecutor, ExecutionContext, ExecutionResult } from "./types";

export const createTaskExecutor: ActionExecutor = {
  kind: "create_task",

  async execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    const task = await db.task.create({
      data: {
        userId: ctx.userId,
        title: ctx.title,
        description: ctx.payload && typeof ctx.payload === "object"
          ? (ctx.payload as Record<string, string>).description || null
          : null,
        sourceType: "ai_action",
        sourceId: ctx.actionId,
        aiGenerated: true,
        priority: 1,
      },
    });

    return {
      status: "done",
      message: `Task created: ${task.title}`,
      resultPayload: { taskId: task.id },
    };
  },
};
