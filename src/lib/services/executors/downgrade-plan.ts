import type { ActionExecutor, ExecutionContext, ExecutionResult } from "./types";

export const downgradePlanExecutor: ActionExecutor = {
  kind: "downgrade_plan",

  async execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    return {
      status: "requires_manual_step",
      requiresManualStep: true,
      manualStepLabel: `Check if a cheaper plan is available and switch to it`,
      estimatedTime: "5 minutes",
      resultPayload: {
        actionTitle: ctx.title,
      },
    };
  },
};
