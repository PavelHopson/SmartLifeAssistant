"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown, Check, Zap, Shield, Heart, Bell,
  Sparkles, Layers, Target, ArrowRight, Lock, Clock,
} from "lucide-react";
import { UpgradeSuccess } from "@/components/premium/upgrade-success";
import type { PlanInfo } from "@/lib/services/premium";

const FREE_FEATURES = [
  { icon: Zap, key: "bankConnection" },
  { icon: Target, key: "subscriptionDetection" },
  { icon: Check, key: "basicActions" },
  { icon: Bell, key: "basicReminders" },
  { icon: Heart, key: "healthTracking" },
];

const PREMIUM_FEATURES = [
  { icon: Sparkles, key: "guidedAutopilot" },
  { icon: Bell, key: "advancedReminders" },
  { icon: Target, key: "dailyFocusPro" },
  { icon: Heart, key: "healthInsights" },
  { icon: Layers, key: "premiumWidgets" },
  { icon: Shield, key: "prioritySupport" },
];

export default function PricingPage() {
  const t = useTranslations("pricing");
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/premium");
      const data = await res.json();
      setPlan(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPlan();
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "pricing_viewed" }),
    }).catch(() => {});
  }, [fetchPlan]);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      await fetch("/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_trial" }),
      });
      await fetchPlan();
    } catch {}
    setLoading(false);
  };

  const handleUpgrade = async () => {
    setLoading(true);
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "upgrade_started" }),
    }).catch(() => {});

    // Try Stripe Checkout first
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch {}

    // Fallback to demo upgrade if Stripe not configured
    try {
      await fetch("/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade" }),
      });
      await fetchPlan();
    } catch {}
    setLoading(false);
  };

  const isPremium = plan?.isPremium || false;

  // Check for Stripe success redirect
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const justUpgraded = searchParams?.get("success") === "true";

  // Show upgrade success state
  if (isPremium && justUpgraded) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <UpgradeSuccess />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-blue-500/10 flex items-center justify-center mx-auto">
          <Crown size={28} className="text-accent" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground max-w-md mx-auto">{t("subtitle")}</p>
      </div>

      {/* Current plan badge */}
      {plan && (
        <div className="text-center">
          <Badge
            variant={isPremium ? "success" : "default"}
            className="text-sm px-4 py-1"
          >
            {isPremium
              ? plan.isTrial
                ? `${t("trial")} — ${plan.daysRemaining} ${t("daysLeft")}`
                : t("premiumActive")
              : t("freePlan")}
          </Badge>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Free */}
        <Card className={`p-0 ${!isPremium ? "ring-2 ring-border" : ""}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>{t("free")}</CardTitle>
              {!isPremium && <Badge variant="outline">{t("current")}</Badge>}
            </div>
            <p className="text-3xl font-bold mt-2">
              £0 <span className="text-sm font-normal text-muted-foreground">{t("forever")}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FREE_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key} className="flex items-center gap-3 text-sm">
                  <Check size={16} className="text-success flex-shrink-0" />
                  <span>{t(`feature_${f.key}`)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Premium */}
        <Card className={`p-0 relative overflow-hidden ${isPremium ? "ring-2 ring-accent" : ""}`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-blue-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown size={16} className="text-accent" />
                {t("premium")}
              </CardTitle>
              {isPremium && <Badge variant="success">{t("active")}</Badge>}
            </div>
            <p className="text-3xl font-bold mt-2">
              £4.99 <span className="text-sm font-normal text-muted-foreground">{t("perMonth")}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">{t("includesFree")}</p>
            {PREMIUM_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key} className="flex items-center gap-3 text-sm">
                  <Check size={16} className="text-accent flex-shrink-0" />
                  <span className="font-medium">{t(`feature_${f.key}`)}</span>
                </div>
              );
            })}

            {!isPremium && (
              <div className="pt-4 space-y-2">
                {!plan?.trialUsed && (
                  <Button
                    variant="premium"
                    className="w-full"
                    size="lg"
                    onClick={handleStartTrial}
                    disabled={loading}
                  >
                    {t("startTrial")}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                )}
                <Button
                  variant={plan?.trialUsed ? "premium" : "outline"}
                  className="w-full"
                  size={plan?.trialUsed ? "lg" : "md"}
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {t("upgrade")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
        <span className="flex items-center gap-1.5"><Shield size={12} />{t("securePayment")}</span>
        <span className="flex items-center gap-1.5"><Check size={12} />{t("cancelAnytime")}</span>
        <span className="flex items-center gap-1.5"><Clock size={12} />{t("noHiddenFees")}</span>
      </div>
      <p className="text-center text-xs text-muted-foreground">{t("guarantee")}</p>
    </div>
  );
}
