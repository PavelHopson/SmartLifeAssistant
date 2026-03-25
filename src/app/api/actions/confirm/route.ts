import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { confirmAction, confirmAllActions } from "@/lib/services/action-execution";

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();

  // Confirm single action or all
  if (body.actionId) {
    const action = await confirmAction(body.actionId, userId);
    return NextResponse.json({ confirmed: 1, action });
  }

  // Confirm all (optionally by groupId)
  const count = await confirmAllActions(userId, body.groupId);
  return NextResponse.json({ confirmed: count });
}
