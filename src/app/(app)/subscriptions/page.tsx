import { useTranslations } from "next-intl";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { SavingsBanner } from "@/components/dashboard/savings-banner";
import { mockSubscriptions } from "@/lib/services/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function SubscriptionsPage() {
  const t = useTranslations("subscriptions");

  const subscriptions = mockSubscriptions;
  const totalMonthly = subscriptions
    .filter((s) => s.status !== "cancelled")
    .reduce((sum, s) => sum + s.estimatedAmount, 0);
  const totalSavings = subscriptions.reduce(
    (sum, s) => sum + (s.potentialSaving || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("detected", { count: subscriptions.length })} &middot;{" "}
          {formatCurrency(totalMonthly)} /month
        </p>
      </div>

      <SavingsBanner amount={totalSavings} currency="GBP" />

      <SubscriptionList subscriptions={subscriptions} />
    </div>
  );
}
