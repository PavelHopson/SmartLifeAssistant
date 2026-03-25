import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { executeConfirmedActions } from "@/lib/services/action-execution";
import { sendNotification } from "@/lib/services/notifications";
import { createTaskFromManualStep } from "@/lib/services/tasks";
import { autoCreateWidgets } from "@/lib/services/widget-auto-create";
import { trackEvent } from "@/lib/services/analytics";
import { emitRealtimeEvent } from "@/lib/services/realtime";

export async function POST() {
  const userId = await getCurrentUserId();
  const results = await executeConfirmedActions(userId);

  for (const r of results) {
    if (r.status === "requires_manual_step" && r.manualStepLabel) {
      await createTaskFromManualStep(
        userId,
        r.actionId,
        r.manualStepLabel,
        r.manualStepUrl || undefined
      );

      await sendNotification({
        userId,
        type: "action_requires_manual_step",
        title: "Manual step required",
        body: `${r.title}: ${r.manualStepLabel}`,
        relatedEntityType: "ai_action",
        relatedEntityId: r.actionId,
      });
    }

    if (r.status === "done") {
      await sendNotification({
        userId,
        type: "action_completed",
        title: "Action completed",
        body: r.message || `${r.title} has been completed.`,
        relatedEntityType: "ai_action",
        relatedEntityId: r.actionId,
      });

      await trackEvent({
        userId,
        eventType: "action_completed",
        entityType: "ai_action",
        entityId: r.actionId,
      });
    }

    await trackEvent({
      userId,
      eventType: "action_executed",
      entityType: "ai_action",
      entityId: r.actionId,
      metadata: { status: r.status },
    });
  }

  // Auto-create widgets for new high-priority tasks
  await autoCreateWidgets(userId);

  // Emit realtime events
  emitRealtimeEvent(userId, "action_status_changed", { count: results.length });
  emitRealtimeEvent(userId, "notification_count_changed", {});
  emitRealtimeEvent(userId, "task_status_changed", {});

  return NextResponse.json({ results });
}
