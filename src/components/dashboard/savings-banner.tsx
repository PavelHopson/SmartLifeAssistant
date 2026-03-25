"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { PiggyBank } from "lucide-react";

export function SavingsBanner({ amount, currency }: { amount: number; currency: string }) {
  const t = useTranslations("savings");
  const tc = useTranslations("common");

  if (amount <= 0) return null;

  return (
    <Card className="p-5 bg-success/5 border-success/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <PiggyBank size={20} className="text-success" />
          </div>
          <div>
            <p className="font-semibold">
              {t("found", { amount: formatCurrency(amount, currency) })}
            </p>
            <p className="text-sm text-muted-foreground">{t("reviewSubs")}</p>
          </div>
        </div>
        <Button variant="accent" size="sm">{tc("review")}</Button>
      </div>
    </Card>
  );
}
