"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareCard } from "@/components/share/share-card";
import { formatCurrency } from "@/lib/utils";
import { mockWow } from "@/lib/services/mock-data";
import type { WowData } from "@/lib/domain/types";
import {
  Sparkles, AlertTriangle, Zap, ArrowRight, PiggyBank, CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function WowPage() {
  const t = useTranslations("wow");
  const tSavings = useTranslations("savings");
  const [data] = useState<WowData>(mockWow);
  const [tracked, setTracked] = useState(false);

  // Track wow_seen
  useEffect(() => {
    if (!tracked) {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "wow_seen" }),
      }).catch(() => {});
      setTracked(true);
    }
  }, [tracked]);

  const allDone = data.topActions.every(
    (a) => a.status === "done" || a.status === "confirmed"
  );

  return (
    <div className="max-w-lg mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
          {allDone ? (
            <CheckCircle size={36} className="text-success" />
          ) : (
            <Sparkles size={36} className="text-success" />
          )}
        </div>
        <h1 className="text-3xl font-bold">
          {allDone ? t("greatWork") : t("analysisComplete")}
        </h1>
        <p className="text-muted-foreground">
          {allDone
            ? t("subtitleDone")
            : t("subtitleNew")}
        </p>
      </div>

      <Card className="p-8 text-center bg-gradient-to-br from-success/5 to-accent/5">
        <div className="flex items-center justify-center gap-3 mb-2">
          <PiggyBank size={28} className="text-success" />
        </div>
        <p className="text-4xl font-bold text-success mb-1">
          {formatCurrency(data.totalSavings, data.currency)}
        </p>
        <p className="text-muted-foreground text-sm">
          {allDone ? tSavings("savedPerYear") : tSavings("potentialPerYear")}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <AlertTriangle size={16} className="mx-auto text-warning mb-1" />
          <p className="text-2xl font-bold">{data.issuesFound}</p>
          <p className="text-xs text-muted-foreground">{t("issuesFound")}</p>
        </Card>
        <Card className="p-4 text-center">
          <Zap size={16} className="mx-auto text-accent mb-1" />
          <p className="text-2xl font-bold">{data.actionsReady}</p>
          <p className="text-xs text-muted-foreground">{t("actionsReady")}</p>
        </Card>
      </div>

      {!allDone && (
        <div className="space-y-3">
          <h2 className="font-semibold">{t("whatWeFound")}</h2>
          {data.topActions.slice(0, 3).map((action) => (
            <Card key={action.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{action.title}</span>
                    {action.impactAmount && (
                      <Badge variant="success">
                        {formatCurrency(action.impactAmount)}/yr
                      </Badge>
                    )}
                  </div>
                  {action.explanation && (
                    <p className="text-xs text-muted-foreground italic">
                      {action.explanation}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Link href="/actions">
        <Button variant="accent" className="w-full" size="lg">
          {allDone ? t("viewCompleted") : t("fixEverything")}
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </Link>

      <ShareCard
        savings={data.totalSavings}
        issuesFixed={data.issuesFound}
        currency={data.currency}
      />
    </div>
  );
}
