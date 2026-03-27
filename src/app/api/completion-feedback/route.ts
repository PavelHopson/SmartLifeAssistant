import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getCompletionFeedback } from "@/lib/services/completion-feedback";

export async function GET() {
  const userId = await getCurrentUserId();
  const feedback = await getCompletionFeedback(userId);
  return NextResponse.json({ feedback });
}
