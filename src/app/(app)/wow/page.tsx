"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareCard } from "@/components/share/share-card";
import { AutopilotBanner } from "@/components/premium/autopilot-banner";
import { formatCurrency } from "@/lib/utils";
import { mockWow } from "@/lib/services/mock-data";
import type { WowData } from "@/lib/domain/types";
import {
  Sparkles, AlertTriangle, Zap, ArrowRight, PiggyBank, CheckCircle,
  Bot, Check,
} from "lucide-react";
import Link from "next/link";

export default function WowPage() {
  const t = useTranslations("wow");
  const tSavings = useTranslations("savings");
  const tAuto = useTranslations("autopilot");
  const [data] = useState<WowData>(mockWow);
  const [tracked, setTracked] = useState(false);

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
    <div className="max-w-lg mx-auto py-10 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto shadow-sm">
          {allDone ? (
            <CheckCircle size={36} className="text-success" />
          ) : (
            <Sparkles size={36} className="text-success" />
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {allDone ? t("greatWork") : t("analysisComplete")}
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
          {allDone ? t("subtitleDone") : t("subtitleNew")}
        </p>
      </div>

      {/* Savings hero card */}
      <Card className="overflow-hidden border-success/20">
        <div className="h-1 bg-gradient-to-r from-success to-emerald-400" />
        <CardContent className="p-8 text-center">
          <PiggyBank size={28} className="mx-auto text-success mb-3" />
          <p className="text-5xl font-bold text-success tracking-tight mb-1">
            {formatCurrency(data.totalSavings, data.currency)}
          </p>
          <p className="text-muted-foreground text-sm">
            {allDone ? tSavings("savedPerYear") : tSavings("potentialPerYear")}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 text-center">
          <AlertTriangle size={16} className="mx-auto text-warning mb-2" />
          <p className="text-3xl font-bold tracking-tight">{data.issuesFound}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("issuesFound")}</p>
        </Card>
        <Card className="p-5 text-center">
          <Zap size={16} className="mx-auto text-accent mb-2" />
          <p className="text-3xl font-bold tracking-tight">{data.actionsReady}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("actionsReady")}</p>
        </Card>
      </div>

      {/* Found issues */}
      {!allDone && data.topActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("whatWeFound")}</h2>
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
                    <p className="text-xs text-muted-foreground">{action.explanation}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Primary CTA */}
      <Link href="/actions" className="block">
        <Button variant="accent" className="w-full" size="lg">
          {allDone ? t("viewCompleted") : t("fixEverything")}
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </Link>

      {/* Autopilot upsell — premium value pitch */}
      {!allDone && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("orLetUsHandle")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Card className="overflow-hidden border-accent/15">
            <div className="h-0.5 bg-gradient-to-r from-accent to-blue-500" />
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/10 to-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Bot size={22} className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">{tAuto("title")}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t("autopilotWowDesc")}</p>
                  <div className="flex flex-col gap-1.5 mb-4">
                    {[t("autopilotBenefit1"), t("autopilotBenefit2"), t("autopilotBenefit3")].map((b, i) => (
                      <span key={i} className="flex items-center gap-2 text-xs">
                        <Check size={12} className="text-accent flex-shrink-0" />
                        {b}
                      </span>
                    ))}
                  </div>
                  <Link href="/pricing">
                    <Button variant="premium" size="md">
                      {tAuto("enableAutopilot")}
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Share */}
      <ShareCard
        savings={data.totalSavings}
        issuesFixed={data.issuesFound}
        currency={data.currency}
      />
    </div>
  );
}
