import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getPlanInfo, startTrial, upgradeToPremium } from "@/lib/services/premium";
import { trackEvent } from "@/lib/services/analytics";

export async function GET() {
  const userId = await getCurrentUserId();
  const plan = await getPlanInfo(userId);
  return NextResponse.json(plan);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  const body = await req.json();
  const { action } = body;

  if (action === "start_trial") {
    try {
      const plan = await startTrial(userId);
      await trackEvent({ userId, eventType: "trial_started" as any, metadata: { plan: plan.plan } });
      return NextResponse.json(plan);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  if (action === "upgrade") {
    const plan = await upgradeToPremium(userId);
    await trackEvent({ userId, eventType: "upgrade_completed" as any, metadata: { plan: plan.plan } });
    return NextResponse.json(plan);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
