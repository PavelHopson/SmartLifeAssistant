import type { ActionExecutor, ExecutionContext, ExecutionResult } from "./types";

export const reviewDuplicateExecutor: ActionExecutor = {
  kind: "review_duplicate",

  async execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    return {
      status: "requires_manual_step",
      requiresManualStep: true,
      manualStepLabel: `Review whether you have duplicate subscriptions and cancel the extra one`,
      estimatedTime: "5 minutes",
      resultPayload: {
        actionTitle: ctx.title,
      },
    };
  },
};
