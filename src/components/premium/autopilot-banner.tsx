"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ArrowRight, Zap, Shield, Clock } from "lucide-react";
import Link from "next/link";

interface AutopilotBannerProps {
  variant?: "full" | "compact" | "inline";
  actionsCount?: number;
  savingsAmount?: number;
}

export function AutopilotBanner({ variant = "full", actionsCount, savingsAmount }: AutopilotBannerProps) {
  const t = useTranslations("autopilot");

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-accent/5 to-blue-500/5 border border-accent/10">
        <Bot size={16} className="text-accent flex-shrink-0" />
        <span className="text-xs text-muted-foreground flex-1">{t("inlineHint")}</span>
        <Link href="/pricing">
          <Button variant="premium" size="sm">
            {t("enable")}
          </Button>
        </Link>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Card className="overflow-hidden border-accent/15">
        <div className="h-0.5 bg-gradient-to-r from-accent to-blue-500" />
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Bot size={20} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-0.5">{t("title")}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t("compactDesc")}</p>
            </div>
            <Link href="/pricing">
              <Button variant="premium" size="sm">
                {t("enable")}
                <ArrowRight size={12} className="ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card className="overflow-hidden border-accent/15">
      <div className="h-1 bg-gradient-to-r from-accent to-blue-500" />
      <CardContent className="p-8">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-blue-500/10 flex items-center justify-center mx-auto">
            <Bot size={28} className="text-accent" />
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight mb-2">{t("title")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {t("fullDesc")}
            </p>
          </div>

          {(actionsCount || savingsAmount) && (
            <div className="flex items-center justify-center gap-6 text-sm">
              {actionsCount && actionsCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{actionsCount}</p>
                  <p className="text-xs text-muted-foreground">{t("actionsReady")}</p>
                </div>
              )}
              {savingsAmount && savingsAmount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">£{Math.round(savingsAmount)}</p>
                  <p className="text-xs text-muted-foreground">{t("potentialSavings")}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Zap size={12} className="text-accent" />{t("featureAuto")}</span>
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-accent" />{t("featureSmart")}</span>
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-accent" />{t("featureSafe")}</span>
          </div>

          <Link href="/pricing">
            <Button variant="premium" size="lg" className="px-8">
              {t("enableAutopilot")}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
