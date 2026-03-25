import type {
  DashboardMetrics,
  SubscriptionView,
  ActionCardView,
  WowData,
} from "@/lib/domain/types";

export const mockMetrics: DashboardMetrics = {
  monthlySpending: 2340.5,
  potentialSavings: 275.76,
  activeSubscriptions: 8,
  pendingActions: 4,
  completedActions: 2,
  totalActions: 6,
  currency: "GBP",
};

export const mockSubscriptions: SubscriptionView[] = [
  { id: "1", merchantName: "Netflix", estimatedAmount: 15.99, currency: "GBP", frequency: "monthly", status: "active", lastChargeDate: "2026-03-01", potentialSaving: null, daysSinceLastUse: null },
  { id: "2", merchantName: "Spotify", estimatedAmount: 10.99, currency: "GBP", frequency: "monthly", status: "active", lastChargeDate: "2026-03-05", potentialSaving: null, daysSinceLastUse: null },
  { id: "3", merchantName: "Adobe Creative Cloud", estimatedAmount: 49.94, currency: "GBP", frequency: "monthly", status: "active", lastChargeDate: "2026-02-28", potentialSaving: null, daysSinceLastUse: null },
  { id: "4", merchantName: "Headspace", estimatedAmount: 9.99, currency: "GBP", frequency: "monthly", status: "unused", lastChargeDate: "2026-01-15", potentialSaving: 119.88, daysSinceLastUse: 87 },
  { id: "5", merchantName: "YouTube Premium", estimatedAmount: 12.99, currency: "GBP", frequency: "monthly", status: "duplicate", lastChargeDate: "2026-03-02", potentialSaving: 155.88, daysSinceLastUse: null },
  { id: "6", merchantName: "Gym Membership", estimatedAmount: 34.99, currency: "GBP", frequency: "monthly", status: "active", lastChargeDate: "2026-03-01", potentialSaving: null, daysSinceLastUse: null },
  { id: "7", merchantName: "iCloud+", estimatedAmount: 2.99, currency: "GBP", frequency: "monthly", status: "active", lastChargeDate: "2026-03-10", potentialSaving: null, daysSinceLastUse: null },
  { id: "8", merchantName: "Notion", estimatedAmount: 8.0, currency: "GBP", frequency: "monthly", status: "price_increase", lastChargeDate: "2026-03-01", potentialSaving: null, daysSinceLastUse: null },
];

export const mockActions: ActionCardView[] = [
  { id: "a1", kind: "cancel_subscription", title: "Cancel Headspace", summary: "You're paying £9.99/mo for Headspace but haven't used it. Cancel to save £119.88/year.", explanation: "Not used for 87 days", status: "pending_user", priority: 0, riskLevel: "low", impactAmount: 119.88, confidenceScore: 0.9, sourceType: "subscription", sourceId: "4", groupId: "g1" },
  { id: "a2", kind: "review_duplicate", title: "Review duplicate: YouTube Premium", summary: "YouTube Premium appears on 2 accounts. You may be paying twice — £155.88/year potential waste.", explanation: "Multiple charges detected for similar service", status: "pending_user", priority: 0, riskLevel: "low", impactAmount: 155.88, confidenceScore: 0.75, sourceType: "subscription", sourceId: "5", groupId: "g1" },
  { id: "a3", kind: "downgrade_plan", title: "Review price increase: Notion", summary: "Notion has increased in price. Consider downgrading or switching plans.", explanation: "Recent price change detected", status: "pending_user", priority: 1, riskLevel: "low", impactAmount: null, confidenceScore: 0.7, sourceType: "subscription", sourceId: "8", groupId: "g1" },
  { id: "a4", kind: "reduce_spending", title: "Spending alert: Dining out", summary: "You spent £180 more on dining out this month vs. your average.", explanation: "62% above your 3-month average", status: "pending_user", priority: 2, riskLevel: "medium", impactAmount: 180, confidenceScore: 0.65, sourceType: "transaction", sourceId: null, groupId: "g1" },
];

export const mockWow: WowData = {
  totalSavings: 275.76,
  issuesFound: 4,
  actionsReady: 4,
  topActions: mockActions,
  currency: "GBP",
};

export interface MockTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  dueAt: string | null;
  aiGenerated: boolean;
  pinned: boolean;
  sourceType: string | null;
}

export const mockTasks: MockTask[] = [
  { id: "t1", title: "Cancel Headspace subscription", description: "Go to headspace.com/settings/subscription and cancel. Estimated time: 2-5 minutes.", status: "open", priority: 0, dueAt: null, aiGenerated: true, pinned: true, sourceType: "ai_action" },
  { id: "t2", title: "Review YouTube Premium duplicate charges", description: "Check if YouTube Premium is active on multiple accounts and cancel the extra.", status: "open", priority: 0, dueAt: null, aiGenerated: true, pinned: false, sourceType: "ai_action" },
  { id: "t3", title: "Check Notion plan options", description: "Visit Notion pricing page and see if a cheaper plan fits your needs.", status: "in_progress", priority: 1, dueAt: "2026-03-28", aiGenerated: true, pinned: false, sourceType: "ai_action" },
  { id: "t4", title: "Review monthly dining budget", description: null, status: "open", priority: 2, dueAt: "2026-03-31", aiGenerated: false, pinned: false, sourceType: null },
];

export interface MockNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const mockNotifications: MockNotification[] = [
  { id: "n1", type: "savings_detected", title: "Savings detected!", body: "We found £275.76 in potential savings from your subscriptions.", read: false, createdAt: "2026-03-25T10:00:00Z" },
  { id: "n2", type: "action_requires_manual_step", title: "Manual step required", body: "Cancel Headspace: Go to headspace.com/settings/subscription", read: false, createdAt: "2026-03-25T10:05:00Z" },
  { id: "n3", type: "action_completed", title: "Action completed", body: "Spending alert acknowledged: Dining out", read: true, createdAt: "2026-03-25T09:30:00Z" },
];

export interface MockWidget {
  id: string;
  taskId: string | null;
  title: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  locked: boolean;
  dueAt: string | null;
  status: string;
}

export const mockWidgets: MockWidget[] = [
  { id: "w1", taskId: "t1", title: "Cancel Headspace", color: "#ef4444", x: 40, y: 40, width: 220, height: 140, pinned: true, locked: false, dueAt: null, status: "open" },
  { id: "w2", taskId: "t2", title: "YouTube duplicate", color: "#f59e0b", x: 300, y: 40, width: 220, height: 140, pinned: false, locked: false, dueAt: null, status: "open" },
  { id: "w3", taskId: "t3", title: "Check Notion plan", color: "#3b82f6", x: 40, y: 220, width: 220, height: 140, pinned: false, locked: false, dueAt: "2026-03-28", status: "in_progress" },
  { id: "w4", taskId: null, title: "Review dining budget", color: "#22c55e", x: 300, y: 220, width: 220, height: 140, pinned: false, locked: false, dueAt: "2026-03-31", status: "open" },
];
