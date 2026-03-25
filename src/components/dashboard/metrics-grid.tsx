"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { DashboardMetrics } from "@/lib/domain/types";
import { TrendingDown, PiggyBank, CreditCard, Zap } from "lucide-react";

export function MetricsGrid({ metrics }: { metrics: DashboardMetrics }) {
  const t = useTranslations("dashboard");

  const cards = [
    { key: "monthlySpending" as const, label: t("monthlySpending"), icon: TrendingDown, color: "text-foreground", isCurrency: true },
    { key: "potentialSavings" as const, label: t("potentialSavings"), icon: PiggyBank, color: "text-success", isCurrency: true },
    { key: "activeSubscriptions" as const, label: t("activeSubscriptions"), icon: CreditCard, color: "text-foreground", isCurrency: false },
    { key: "pendingActions" as const, label: t("pendingActions"), icon: Zap, color: "text-warning", isCurrency: false },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = metrics[card.key];
        return (
          <Card key={card.key} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <p className={`text-2xl font-semibold ${card.color}`}>
              {card.isCurrency ? formatCurrency(value as number, metrics.currency) : value}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
