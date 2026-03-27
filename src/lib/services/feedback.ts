import { db } from "@/lib/db";

export type FeedbackType = "bug" | "suggestion" | "confused" | "other";

interface SubmitFeedbackInput {
  userId: string;
  type: FeedbackType;
  message: string;
  screen?: string;
  metadata?: Record<string, unknown>;
}

export async function submitFeedback(input: SubmitFeedbackInput) {
  return db.userFeedback.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      screen: input.screen,
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
    },
  });
}

export async function getRecentFeedback(limit = 50) {
  return db.userFeedback.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });
}
