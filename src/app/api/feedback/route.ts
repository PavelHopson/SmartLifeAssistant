import { NextRequest, NextResponse } from "next/server";
import { submitFeedback, getRecentFeedback } from "@/lib/services/feedback";
import type { FeedbackType } from "@/lib/services/feedback";

const DEMO_USER = "demo";

export async function GET() {
  try {
    const feedback = await getRecentFeedback(20);
    return NextResponse.json({ feedback });
  } catch {
    return NextResponse.json({ feedback: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, message, screen } = body;

    if (!type || !message) {
      return NextResponse.json({ error: "type and message required" }, { status: 400 });
    }

    const validTypes: FeedbackType[] = ["bug", "suggestion", "confused", "other"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const fb = await submitFeedback({
      userId: DEMO_USER,
      type,
      message,
      screen,
    });

    return NextResponse.json({ id: fb.id, success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
