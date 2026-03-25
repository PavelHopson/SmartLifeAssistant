import { db } from "@/lib/db";
import type { ActionExecutor, ExecutionContext, ExecutionResult } from "./types";

// Known cancellation URLs for common services
const CANCELLATION_URLS: Record<string, string> = {
  Netflix: "https://www.netflix.com/cancelplan",
  Spotify: "https://www.spotify.com/account/subscription/",
  "YouTube Premium": "https://www.youtube.com/paid_memberships",
  "Adobe Creative Cloud": "https://account.adobe.com/plans",
  "Disney+": "https://www.disneyplus.com/account",
  Headspace: "https://www.headspace.com/settings/subscription",
  Notion: "https://www.notion.so/my-account",
  "Amazon Prime": "https://www.amazon.co.uk/mc/pipelines",
};

export const cancelSubscriptionExecutor: ActionExecutor = {
  kind: "cancel_subscription",

  async execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    // Look up the subscription
    const subscription = ctx.sourceId
      ? await db.subscription.findUnique({ where: { id: ctx.sourceId } })
      : null;

    const merchantName = subscription?.merchantName || ctx.title.replace("Cancel ", "");
    const cancellationUrl = CANCELLATION_URLS[merchantName];

    // For MVP: we can't auto-cancel. Generate manual step.
    return {
      status: "requires_manual_step",
      requiresManualStep: true,
      manualStepLabel: `Go to ${merchantName} and cancel your subscription`,
      manualStepUrl: cancellationUrl || null,
      estimatedTime: "2-5 minutes",
      resultPayload: {
        merchantName,
        hasDirectLink: !!cancellationUrl,
      },
    } as ExecutionResult;
  },
};
