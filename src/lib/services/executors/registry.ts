import type { ActionExecutor } from "./types";
import { cancelSubscriptionExecutor } from "./cancel-subscription";
import { reviewDuplicateExecutor } from "./review-duplicate";
import { downgradePlanExecutor } from "./downgrade-plan";
import { createTaskExecutor } from "./create-task";
import { reduceSpendingExecutor } from "./reduce-spending";

const executors: ActionExecutor[] = [
  cancelSubscriptionExecutor,
  reviewDuplicateExecutor,
  downgradePlanExecutor,
  createTaskExecutor,
  reduceSpendingExecutor,
];

const executorMap = new Map<string, ActionExecutor>(
  executors.map((e) => [e.kind, e])
);

export function getExecutor(kind: string): ActionExecutor | undefined {
  return executorMap.get(kind);
}

// Fallback executor for unknown kinds
export const fallbackExecutor: ActionExecutor = {
  kind: "generic",
  async execute(ctx) {
    return {
      status: "requires_manual_step" as const,
      requiresManualStep: true,
      manualStepLabel: `Complete this action manually: ${ctx.title}`,
      estimatedTime: "varies",
    };
  },
};
