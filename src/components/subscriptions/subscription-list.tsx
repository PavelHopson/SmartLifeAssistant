"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionView } from "@/lib/domain/types";
import Link from "next/link";

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive"> = {
  active: "success", unused: "destructive", duplicate: "warning", price_increase: "warning", cancelled: "default",
};

export function SubscriptionList({ subscriptions }: { subscriptions: SubscriptionView[] }) {
  const tStatus = useTranslations("subStatus");
  const tFreq = useTranslations("frequency");
  const ts = useTranslations("savings");
  const tSub = useTranslations("subscriptions");
  const tc = useTranslations("common");

  return (
    <div className="space-y-3">
      {subscriptions.map((sub) => (
        <Card key={sub.id} className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{sub.merchantName}</span>
                <Badge variant={statusVariant[sub.status]}>{tStatus(sub.status)}</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{formatCurrency(sub.estimatedAmount, sub.currency)}{tFreq(sub.frequency)}</span>
                {sub.potentialSaving && (
                  <span className="text-success font-medium">
                    {ts("savePerYear", { amount: formatCurrency(sub.potentialSaving, sub.currency) })}
                  </span>
                )}
              </div>
              {sub.daysSinceLastUse && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {tSub("notUsedDays", { days: sub.daysSinceLastUse })}
                </p>
              )}
            </div>
            {(sub.status === "unused" || sub.status === "duplicate") && (
              <Link href="/actions"><Button variant="accent" size="sm">{tc("fix")}</Button></Link>
            )}
            {sub.status === "price_increase" && (
              <Link href="/actions"><Button variant="outline" size="sm">{tc("review")}</Button></Link>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
