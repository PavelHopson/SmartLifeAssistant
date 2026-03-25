import { db } from "@/lib/db";
import { scheduleUserJobs, schedulePostSyncWorkflow } from "./jobs";
import { sendNotification } from "./notifications";

export interface OnboardingState {
  bankConnected: boolean;
  transactionsSynced: boolean;
  subscriptionsDetected: boolean;
  actionsGenerated: boolean;
  wowSeen: boolean;
  completed: boolean;
}

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      onboardingBankConnected: true,
      onboardingTransactionsSynced: true,
      onboardingSubscriptionsDetected: true,
      onboardingActionsGenerated: true,
      onboardingWowSeen: true,
      onboardingCompletedAt: true,
    },
  });

  if (!user) {
    return {
      bankConnected: false,
      transactionsSynced: false,
      subscriptionsDetected: false,
      actionsGenerated: false,
      wowSeen: false,
      completed: false,
    };
  }

  return {
    bankConnected: user.onboardingBankConnected,
    transactionsSynced: user.onboardingTransactionsSynced,
    subscriptionsDetected: user.onboardingSubscriptionsDetected,
    actionsGenerated: user.onboardingActionsGenerated,
    wowSeen: user.onboardingWowSeen,
    completed: !!user.onboardingCompletedAt,
  };
}

export async function markOnboardingStep(
  userId: string,
  step: keyof Omit<OnboardingState, "completed">
) {
  const fieldMap: Record<string, string> = {
    bankConnected: "onboardingBankConnected",
    transactionsSynced: "onboardingTransactionsSynced",
    subscriptionsDetected: "onboardingSubscriptionsDetected",
    actionsGenerated: "onboardingActionsGenerated",
    wowSeen: "onboardingWowSeen",
  };

  await db.user.update({
    where: { id: userId },
    data: { [fieldMap[step]]: true },
  });
}

export async function completeOnboarding(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { onboardingCompletedAt: new Date() },
  });
}

// Orchestrate the post-bank-connection flow
export async function runPostConnectionFlow(userId: string) {
  // 1. Mark bank connected
  await markOnboardingStep(userId, "bankConnected");

  // 2. Schedule sync jobs
  await schedulePostSyncWorkflow(userId);

  // 3. Schedule recurring jobs for this user
  await scheduleUserJobs(userId);
}

// Called after transaction import completes
export async function onTransactionsSynced(userId: string, count: number) {
  await markOnboardingStep(userId, "transactionsSynced");

  if (count > 0) {
    // Run subscription detection
    const { detectSubscriptions } = await import("./subscription-detection");
    const subsCount = await detectSubscriptions(userId);

    if (subsCount > 0) {
      await markOnboardingStep(userId, "subscriptionsDetected");

      // Generate actions
      const { generateActionsFromSubscriptions } = await import("./action-generation");
      const result = await generateActionsFromSubscriptions(userId);

      if (result.created > 0) {
        await markOnboardingStep(userId, "actionsGenerated");

        // Send savings notification
        const savings = await db.subscription.aggregate({
          where: { userId, potentialSaving: { not: null } },
          _sum: { potentialSaving: true },
        });

        if (savings._sum.potentialSaving && savings._sum.potentialSaving > 0) {
          await sendNotification({
            userId,
            type: "savings_detected",
            title: "Savings detected!",
            body: `We found £${Math.round(savings._sum.potentialSaving * 100) / 100} in potential savings.`,
          });
        }
      }
    }
  }
}
