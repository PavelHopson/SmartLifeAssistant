// Guided execution metadata for different action kinds
// Provides structured steps, context, and expected outcomes

export interface GuidedStep {
  step: number;
  label: string;
  description: string;
  externalUrl?: string;
}

export interface GuidedExecution {
  kind: string;
  title: string;
  whyItMatters: string;
  expectedOutcome: string;
  estimatedTime: string;
  steps: GuidedStep[];
  canAutoComplete: boolean;
}

const CANCELLATION_URLS: Record<string, string> = {
  netflix: "https://www.netflix.com/cancelplan",
  spotify: "https://www.spotify.com/account/subscription/",
  youtube: "https://www.youtube.com/paid_memberships",
  "adobe creative cloud": "https://account.adobe.com/plans",
  "disney+": "https://www.disneyplus.com/account",
  headspace: "https://www.headspace.com/settings/subscription",
  notion: "https://www.notion.so/my-account",
  "amazon prime": "https://www.amazon.co.uk/gp/primecentral",
};

export function getGuidedExecution(kind: string, context: {
  title: string;
  summary?: string | null;
  explanation?: string | null;
  impactAmount?: number | null;
  sourceType?: string | null;
}): GuidedExecution {
  switch (kind) {
    case "cancel_subscription": {
      const merchantLower = (context.title || "").toLowerCase().replace("cancel ", "");
      const url = Object.entries(CANCELLATION_URLS).find(([k]) =>
        merchantLower.includes(k)
      )?.[1];

      return {
        kind,
        title: context.title,
        whyItMatters: context.explanation || "This subscription may no longer be providing value.",
        expectedOutcome: context.impactAmount
          ? `Save £${Math.round(context.impactAmount)}/year`
          : "Stop recurring charges",
        estimatedTime: "2-5 minutes",
        steps: [
          { step: 1, label: "Open subscription settings", description: "Go to the service's account or subscription page.", externalUrl: url },
          { step: 2, label: "Find cancellation option", description: "Look for 'Cancel', 'Downgrade', or 'Manage subscription'." },
          { step: 3, label: "Confirm cancellation", description: "Follow the prompts to confirm. Note any end-of-billing-period dates." },
          { step: 4, label: "Mark as done", description: "Come back and mark this action as completed." },
        ],
        canAutoComplete: false,
      };
    }

    case "review_duplicate": {
      return {
        kind,
        title: context.title,
        whyItMatters: "You may be paying for overlapping services.",
        expectedOutcome: context.impactAmount
          ? `Save up to £${Math.round(context.impactAmount)}/year`
          : "Eliminate duplicate spending",
        estimatedTime: "5 minutes",
        steps: [
          { step: 1, label: "Compare services", description: "Check what each subscription offers." },
          { step: 2, label: "Choose one to keep", description: "Pick the one that gives you more value." },
          { step: 3, label: "Cancel the duplicate", description: "Cancel the less useful subscription." },
          { step: 4, label: "Mark as done", description: "Come back and confirm completion." },
        ],
        canAutoComplete: false,
      };
    }

    case "downgrade_plan": {
      return {
        kind,
        title: context.title,
        whyItMatters: context.explanation || "You may be on a higher tier than you need.",
        expectedOutcome: context.impactAmount
          ? `Save £${Math.round(context.impactAmount)}/year`
          : "Reduce your monthly cost",
        estimatedTime: "5 minutes",
        steps: [
          { step: 1, label: "Check your usage", description: "Review what features you actually use." },
          { step: 2, label: "Compare plans", description: "See if a lower tier covers your needs." },
          { step: 3, label: "Downgrade", description: "Switch to the lower plan." },
          { step: 4, label: "Mark as done", description: "Come back and confirm." },
        ],
        canAutoComplete: false,
      };
    }

    case "health_workout":
      return {
        kind,
        title: context.title,
        whyItMatters: context.explanation || "Regular exercise supports your health goals.",
        expectedOutcome: "Stay on track with your weekly workout goal",
        estimatedTime: "30-60 minutes",
        steps: [
          { step: 1, label: "Choose your activity", description: "Pick a workout: gym, run, home exercise, yoga — anything counts." },
          { step: 2, label: "Complete the workout", description: "Do at least 20 minutes of activity." },
          { step: 3, label: "Log it", description: "Record your workout on the Health page.", externalUrl: undefined },
        ],
        canAutoComplete: true,
      };

    case "health_walk":
      return {
        kind,
        title: context.title,
        whyItMatters: context.explanation || "Walking improves energy and mood.",
        expectedOutcome: "Break sedentary patterns",
        estimatedTime: "15-30 minutes",
        steps: [
          { step: 1, label: "Take a walk", description: "Even 10 minutes helps. Step outside or walk around." },
          { step: 2, label: "Log your walk", description: "Record the minutes on the Health page." },
        ],
        canAutoComplete: true,
      };

    case "health_hydration":
      return {
        kind,
        title: context.title,
        whyItMatters: context.explanation || "Staying hydrated improves focus and energy.",
        expectedOutcome: "Hit your daily water target",
        estimatedTime: "Throughout the day",
        steps: [
          { step: 1, label: "Drink a glass of water now", description: "Start with one glass right away." },
          { step: 2, label: "Track your intake", description: "Use the Health page to log each glass." },
        ],
        canAutoComplete: true,
      };

    case "health_sleep":
      return {
        kind,
        title: context.title,
        whyItMatters: context.explanation || "Consistent sleep is essential for recovery.",
        expectedOutcome: "Get closer to your sleep goal tonight",
        estimatedTime: "Tonight",
        steps: [
          { step: 1, label: "Set a bedtime", description: "Choose a time that gives you enough sleep hours." },
          { step: 2, label: "Wind down", description: "Put screens away 30 minutes before bed." },
          { step: 3, label: "Log your sleep tomorrow", description: "Record how many hours you slept." },
        ],
        canAutoComplete: true,
      };

    default:
      return {
        kind,
        title: context.title,
        whyItMatters: context.explanation || context.summary || "This action needs your attention.",
        expectedOutcome: "Resolve this issue",
        estimatedTime: "5-10 minutes",
        steps: [
          { step: 1, label: "Review the details", description: context.summary || "Check what needs to be done." },
          { step: 2, label: "Take action", description: "Complete the required step." },
          { step: 3, label: "Mark as done", description: "Confirm completion." },
        ],
        canAutoComplete: false,
      };
  }
}
