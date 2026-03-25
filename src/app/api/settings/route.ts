import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getUserSettings, updateUserSettings } from "@/lib/services/settings";
import { trackEvent } from "@/lib/services/analytics";

export async function GET() {
  const userId = await getCurrentUserId();
  const settings = await getUserSettings(userId);
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const updates = await request.json();

  await updateUserSettings(userId, updates);
  await trackEvent({ userId, eventType: "settings_updated" as never, metadata: { fields: Object.keys(updates) } });

  const settings = await getUserSettings(userId);
  return NextResponse.json(settings);
}
