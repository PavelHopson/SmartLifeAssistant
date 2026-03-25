import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import {
  loadWidgets,
  updateWidgetPosition,
  updateWidgetProps,
  completeWidgetTask,
  createWidgetFromTask,
  deleteWidget,
  seedWidgetsFromTasks,
} from "@/lib/services/widget-persistence";
import { trackEvent } from "@/lib/services/analytics";

export async function GET() {
  const userId = await getCurrentUserId();

  // Seed widgets from tasks if none exist
  await seedWidgetsFromTasks(userId);

  const widgets = await loadWidgets(userId);
  return NextResponse.json({ widgets });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();

  if (body.action === "move" && body.widgetId) {
    await updateWidgetPosition(body.widgetId, userId, body.x, body.y);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update" && body.widgetId) {
    await updateWidgetProps(body.widgetId, userId, {
      pinned: body.pinned,
      locked: body.locked,
      color: body.color,
      visible: body.visible,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "complete" && body.widgetId) {
    await completeWidgetTask(body.widgetId, userId);
    await trackEvent({
      userId,
      eventType: "widget_completed_from_surface",
      entityType: "widget",
      entityId: body.widgetId,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "create_from_task" && body.taskId) {
    const widget = await createWidgetFromTask(userId, body.taskId);
    if (widget) {
      await trackEvent({
        userId,
        eventType: "widget_created",
        entityType: "widget",
        entityId: widget.id,
      });
    }
    return NextResponse.json({ widget });
  }

  if (body.action === "delete" && body.widgetId) {
    await deleteWidget(body.widgetId, userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
