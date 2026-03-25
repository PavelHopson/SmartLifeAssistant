import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getOnboardingState } from "@/lib/services/onboarding";

export async function GET() {
  const userId = await getCurrentUserId();
  const state = await getOnboardingState(userId);
  return NextResponse.json(state);
}
