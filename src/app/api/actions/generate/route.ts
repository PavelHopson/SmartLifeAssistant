import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { generateActionsFromSubscriptions } from "@/lib/services/action-generation";

export async function POST() {
  const userId = await getCurrentUserId();
  const result = await generateActionsFromSubscriptions(userId);
  return NextResponse.json(result);
}
