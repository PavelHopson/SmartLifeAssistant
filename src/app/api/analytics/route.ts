import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { trackEvent, getRecentEvents, type EventType } from "@/lib/services/analytics";

export async function GET() {
  const userId = await getCurrentUserId();
  const events = await getRecentEvents(userId, 100);
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();

  const event = await trackEvent({
    userId,
    eventType: body.eventType as EventType,
    entityType: body.entityType,
    entityId: body.entityId,
    metadata: body.metadata,
  });

  return NextResponse.json({ event });
}
