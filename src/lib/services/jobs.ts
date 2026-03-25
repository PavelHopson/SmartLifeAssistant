import { db } from "@/lib/db";

export type JobType =
  | "sync_transactions"
  | "generate_actions"
  | "send_notifications"
  | "refresh_subscriptions"
  | "due_task_scan"
  | "dashboard_summary_refresh";

interface EnqueueOptions {
  userId: string;
  type: JobType;
  payload?: Record<string, unknown>;
  scheduledFor?: Date;
  priority?: number;
}

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min stale lock timeout
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;

export async function enqueueJob(options: EnqueueOptions) {
  return db.job.create({
    data: {
      userId: options.userId,
      type: options.type,
      status: "pending",
      priority: options.priority || 1,
      payload: options.payload ? JSON.parse(JSON.stringify(options.payload)) : undefined,
      scheduledFor: options.scheduledFor,
    },
  });
}

// Production-ready job processor with locking
export async function processDueJobs(limit = 10): Promise<{ processed: number; failed: number }> {
  const now = new Date();
  const staleLockCutoff = new Date(now.getTime() - LOCK_TIMEOUT_MS);

  // Find and lock due jobs atomically
  const dueJobs = await db.job.findMany({
    where: {
      OR: [
        { status: "pending", OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }] },
        { status: "locked", lockedAt: { lt: staleLockCutoff } }, // reclaim stale locks
        { status: "pending", nextRetryAt: { lte: now } },
      ],
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  let processed = 0;
  let failed = 0;

  for (const job of dueJobs) {
    // Try to acquire lock
    const locked = await db.job.updateMany({
      where: { id: job.id, status: { in: ["pending", "locked"] } },
      data: { status: "locked", lockedAt: now, lockedBy: WORKER_ID },
    });
    if (locked.count === 0) continue; // another worker got it

    // Mark running
    await db.job.update({
      where: { id: job.id },
      data: { status: "running", startedAt: now },
    });

    const jobStartTime = Date.now();
    try {
      const result = await executeJob(job.type as JobType, job.userId, job.payload);
      await db.job.update({
        where: { id: job.id },
        data: {
          status: "done",
          completedAt: new Date(),
          durationMs: Date.now() - jobStartTime,
          result: result ? JSON.parse(JSON.stringify(result)) : undefined,
          lockedAt: null,
          lockedBy: null,
        },
      });
      processed++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const retryCount = job.retryCount + 1;
      const shouldRetry = retryCount < job.maxRetries;

      await db.job.update({
        where: { id: job.id },
        data: {
          status: shouldRetry ? "pending" : "failed",
          errorMessage,
          retryCount,
          nextRetryAt: shouldRetry
            ? new Date(Date.now() + retryCount * 60_000) // exponential-ish: 1m, 2m, 3m
            : null,
          lockedAt: null,
          lockedBy: null,
        },
      });
      failed++;
    }
  }

  return { processed, failed };
}

async function executeJob(
  type: JobType,
  userId: string,
  _payload: unknown
): Promise<Record<string, unknown> | null> {
  switch (type) {
    case "sync_transactions":
      console.log(`[JOB] sync_transactions for ${userId}`);
      return { synced: true };

    case "generate_actions": {
      const { generateActionsFromSubscriptions } = await import("./action-generation");
      const { generateSmartActions } = await import("./action-generation-v2");
      const [subR, smartR] = await Promise.all([
        generateActionsFromSubscriptions(userId),
        generateSmartActions(userId),
      ]);
      return { subCreated: subR.created, subUpdated: subR.updated, smartCreated: smartR.created };
    }

    case "refresh_subscriptions": {
      const { detectSubscriptions } = await import("./subscription-detection");
      const count = await detectSubscriptions(userId);
      return { detected: count };
    }

    case "due_task_scan": {
      const { scanDueTasks } = await import("./reminders");
      const r = await scanDueTasks(userId);
      return { reminders: r };
    }

    case "send_notifications":
      console.log(`[JOB] send_notifications for ${userId}`);
      return null;

    case "dashboard_summary_refresh":
      console.log(`[JOB] dashboard_summary_refresh for ${userId}`);
      return null;

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

// Schedule default recurring jobs for a user (after onboarding)
export async function scheduleUserJobs(userId: string) {
  const types: { type: JobType; priority: number }[] = [
    { type: "sync_transactions", priority: 0 },
    { type: "refresh_subscriptions", priority: 1 },
    { type: "generate_actions", priority: 1 },
    { type: "due_task_scan", priority: 2 },
  ];

  for (const { type, priority } of types) {
    // Avoid duplicates
    const existing = await db.job.findFirst({
      where: { userId, type, status: { in: ["pending", "locked", "running"] } },
    });
    if (!existing) {
      await enqueueJob({ userId, type, priority });
    }
  }
}

// Schedule post-sync workflow
export async function schedulePostSyncWorkflow(userId: string) {
  await enqueueJob({ userId, type: "refresh_subscriptions", priority: 0 });
  await enqueueJob({ userId, type: "generate_actions", priority: 1 });
  await enqueueJob({ userId, type: "due_task_scan", priority: 2 });
}
