export type SubscriptionStatus =
  | "active"
  | "unused"
  | "duplicate"
  | "price_increase"
  | "cancelled";

export type SubscriptionFrequency =
  | "monthly"
  | "weekly"
  | "yearly"
  | "unknown";

export type AiActionStatus =
  | "draft"
  | "pending_user"
  | "confirmed"
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "requires_manual_step"
  | "expired";

export type AiActionKind =
  | "cancel_subscription"
  | "review_subscription"
  | "review_duplicate"
  | "downgrade_plan"
  | "reduce_spending"
  | "switch_provider"
  | "generic";

export type RiskLevel = "low" | "medium" | "high";
export type TransactionDirection = "debit" | "credit";
export type ConnectionStatus = "pending" | "connected" | "error" | "revoked";

export interface DashboardMetrics {
  monthlySpending: number;
  potentialSavings: number;
  activeSubscriptions: number;
  pendingActions: number;
  completedActions: number;
  totalActions: number;
  currency: string;
}

export interface SubscriptionView {
  id: string;
  merchantName: string;
  estimatedAmount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  status: SubscriptionStatus;
  lastChargeDate: string | null;
  potentialSaving: number | null;
  daysSinceLastUse: number | null;
}

export interface ActionCardView {
  id: string;
  kind: AiActionKind;
  title: string;
  summary: string | null;
  explanation: string | null;
  status: AiActionStatus;
  priority: number;
  riskLevel: RiskLevel;
  impactAmount: number | null;
  confidenceScore: number;
  sourceType: string | null;
  sourceId: string | null;
  groupId: string | null;
}

export interface WowData {
  totalSavings: number;
  issuesFound: number;
  actionsReady: number;
  topActions: ActionCardView[];
  currency: string;
}
