import { useTranslations } from "next-intl";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { ActionCard } from "@/components/dashboard/action-card";
import { SavingsBanner } from "@/components/dashboard/savings-banner";
import { AiSummary } from "@/components/dashboard/ai-summary";
import { Progress } from "@/components/ui/progress";
import { mockMetrics, mockActions } from "@/lib/services/mock-data";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tSummary = useTranslations("summary");

  // Mock summary — in production: from generateDashboardSummary()
  const mockSummary = {
    greeting: tSummary("goodAfternoon"),
    items: [
      { icon: "savings" as const, text: tSummary("canSave", { amount: "£275.76" }) },
      { icon: "action" as const, text: tSummary("actionsPending", { count: 4 }) },
      { icon: "task" as const, text: tSummary("tasksOverdue", { count: 1 }) },
      { icon: "check" as const, text: tSummary("actionsCompleted", { count: 2 }) },
    ],
    nextStep: tSummary("nextStepActions"),
  };

  const metrics = mockMetrics;
  const actions = mockActions.filter((a) => a.status === "pending_user");
  const progress =
    metrics.totalActions > 0
      ? (metrics.completedActions / metrics.totalActions) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("subtitle")}
        </p>
      </div>

      <AiSummary {...mockSummary} />

      <MetricsGrid metrics={metrics} />

      <SavingsBanner
        amount={metrics.potentialSavings}
        currency={metrics.currency}
      />

      {metrics.totalActions > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {t("issuesFixed", { done: metrics.completedActions, total: metrics.totalActions })}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">{t("requiresAction")}</h2>
        <div className="space-y-3">
          {actions.slice(0, 3).map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
        {actions.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("noActions")}
          </p>
        )}
      </div>
    </div>
  );
}
