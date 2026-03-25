import { db } from "@/lib/db";
import { getExecutor, fallbackExecutor } from "./executors/registry";
import type { ExecutionContext } from "./executors/types";

export async function confirmAction(actionId: string, userId: string) {
  return db.aiAction.update({
    where: { id: actionId, userId },
    data: { status: "confirmed", confirmedAt: new Date() },
  });
}

export async function confirmAllActions(userId: string, groupId?: string) {
  const where: Record<string, unknown> = { userId, status: "pending_user" };
  if (groupId) where.groupId = groupId;

  const result = await db.aiAction.updateMany({
    where,
    data: { status: "confirmed", confirmedAt: new Date() },
  });
  return result.count;
}

export interface ExecuteResult {
  actionId: string;
  title: string;
  status: string;
  manualStepLabel?: string | null;
  manualStepUrl?: string | null;
  estimatedTime?: string | null;
  message?: string;
}

export async function executeConfirmedActions(userId: string): Promise<ExecuteResult[]> {
  const confirmed = await db.aiAction.findMany({
    where: { userId, status: "confirmed" },
  });

  const results: ExecuteResult[] = [];

  for (const action of confirmed) {
    // Mark as running
    await db.aiAction.update({
      where: { id: action.id },
      data: { status: "running" },
    });

    const executor = getExecutor(action.kind) || fallbackExecutor;

    const ctx: ExecutionContext = {
      actionId: action.id,
      userId: action.userId,
      kind: action.kind,
      title: action.title,
      sourceType: action.sourceType,
      sourceId: action.sourceId,
      payload: action.payload,
    };

    const result = await executor.execute(ctx);

    // Persist execution
    await db.actionExecution.create({
      data: {
        actionId: action.id,
        userId,
        executorType: `${action.kind}_executor`,
        status: result.status,
        errorMessage: result.errorMessage || null,
        resultPayload: result.resultPayload
          ? JSON.parse(JSON.stringify(result.resultPayload))
          : null,
        requiresManualStep: result.requiresManualStep || false,
        manualStepLabel: result.manualStepLabel || null,
        manualStepUrl: result.manualStepUrl || null,
        estimatedTime: result.estimatedTime || null,
        retryable: result.retryable || false,
        completedAt: result.status === "done" ? new Date() : null,
      },
    });

    // Update action status
    const finalStatus = result.status === "done"
      ? "done"
      : result.status === "requires_manual_step"
        ? "requires_manual_step"
        : "failed";

    await db.aiAction.update({
      where: { id: action.id },
      data: {
        status: finalStatus,
        completedAt: finalStatus === "done" ? new Date() : null,
      },
    });

    results.push({
      actionId: action.id,
      title: action.title,
      status: finalStatus,
      manualStepLabel: result.manualStepLabel,
      manualStepUrl: result.manualStepUrl,
      estimatedTime: result.estimatedTime,
      message: result.message,
    });
  }

  return results;
}

export async function getActionStats(userId: string) {
  const [total, pending, confirmed, done, manual] = await Promise.all([
    db.aiAction.count({ where: { userId } }),
    db.aiAction.count({ where: { userId, status: "pending_user" } }),
    db.aiAction.count({ where: { userId, status: "confirmed" } }),
    db.aiAction.count({ where: { userId, status: "done" } }),
    db.aiAction.count({ where: { userId, status: "requires_manual_step" } }),
  ]);
  return { total, pending, confirmed, done, manual };
}
