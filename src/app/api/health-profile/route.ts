import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getHealthProfile, upsertHealthProfile } from "@/lib/services/health-profile";
import { getHealthDashboard } from "@/lib/services/health-logs";
import { trackEvent } from "@/lib/services/analytics";

export async function GET() {
  const userId = await getCurrentUserId();
  const [profile, dashboard] = await Promise.all([
    getHealthProfile(userId),
    getHealthDashboard(userId),
  ]);

  return NextResponse.json({ profile, dashboard });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  const body = await req.json();
  const existing = await getHealthProfile(userId);
  const isNew = !existing;

  const profile = await upsertHealthProfile(userId, body);

  await trackEvent({
    userId,
    eventType: isNew ? "health_profile_created" : "health_goal_updated",
    metadata: { goal: profile.goal, activityLevel: profile.activityLevel },
  });

  return NextResponse.json({ profile });
}
