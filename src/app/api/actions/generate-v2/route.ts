import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { generateActionsFromSubscriptions } from "@/lib/services/action-generation";
import { generateSmartActions } from "@/lib/services/action-generation-v2";

export async function POST() {
  const userId = await getCurrentUserId();

  // Run both generators
  const [subResult, smartResult] = await Promise.all([
    generateActionsFromSubscriptions(userId),
    generateSmartActions(userId),
  ]);

  return NextResponse.json({
    subscriptionActions: subResult,
    smartActions: smartResult,
    total: subResult.created + subResult.updated + smartResult.created,
  });
}
