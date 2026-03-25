import type { ActionExecutor, ExecutionContext, ExecutionResult } from "./types";

export const reduceSpendingExecutor: ActionExecutor = {
  kind: "reduce_spending",

  async execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    // Spending alerts are informational — mark as done once acknowledged
    return {
      status: "done",
      message: `Spending alert acknowledged: ${ctx.title}`,
      resultPayload: { acknowledged: true },
    };
  },
};
