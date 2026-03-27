"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Building2, ArrowRight, Loader2, CheckCircle, XCircle,
} from "lucide-react";

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

interface OnboardingState {
  bankConnected: boolean;
  transactionsSynced: boolean;
  subscriptionsDetected: boolean;
  actionsGenerated: boolean;
  wowSeen: boolean;
  completed: boolean;
}

function OnboardingContent() {
  const t = useTranslations("onboarding");
  const params = useSearchParams();
  const router = useRouter();
  const step = params.get("step");
  const error = params.get("error");

  const steps = [
    { key: "bankConnected" as const, label: t("stepBankConnected") },
    { key: "transactionsSynced" as const, label: t("stepTransactions") },
    { key: "subscriptionsDetected" as const, label: t("stepSubscriptions") },
    { key: "actionsGenerated" as const, label: t("stepActions") },
  ];

  const [state, setState] = useState<OnboardingState | null>(null);
  const [polling, setPolling] = useState(step === "analyzing");

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/state");
      if (res.ok) {
        const data = await res.json();
        setState(data);
        // Auto-advance to /wow when ready
        if (data.actionsGenerated && !data.wowSeen) {
          router.push("/wow");
        }
      }
    } catch {
      // continue polling
    }
  }, [router]);

  useEffect(() => {
    if (polling) {
      fetchState();
      const interval = setInterval(fetchState, 3000);
      return () => clearInterval(interval);
    }
  }, [polling, fetchState]);

  // Start polling if we land on analyzing step
  useEffect(() => {
    if (step === "analyzing") setPolling(true);
  }, [step]);

  const handleConnect = () => {
    window.location.href = "/api/truelayer/auth";
  };

  // Analyzing view
  if (step === "analyzing") {
    const progressValue = state
      ? [state.bankConnected, state.transactionsSynced, state.subscriptionsDetected, state.actionsGenerated]
          .filter(Boolean).length * 25
      : 10;

    return (
      <div className="max-w-lg mx-auto py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles size={28} className="text-accent" />
          </div>
          <h1 className="text-2xl font-semibold">{t("analyzing")}</h1>
          <p className="text-muted-foreground">
            {t("analyzingDesc")}
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-3">
            {steps.map((s) => {
              const done = state?.[s.key] ?? false;
              const isActive = !done && (state ? true : s.key === "bankConnected");
              return (
                <div key={s.key} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle size={18} className="text-success" />
                  ) : isActive ? (
                    <Loader2 size={18} className="text-accent animate-spin" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-border" />
                  )}
                  <span className={`text-sm ${done ? "text-success" : isActive ? "font-medium" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progressValue} />
        </Card>

        {state?.actionsGenerated && (
          <div className="text-center">
            <Button variant="accent" onClick={() => router.push("/wow")}>
              {t("seeResults")}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Default: connect bank view
  return (
    <div className="max-w-lg mx-auto py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
          <Sparkles size={28} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-destructive" />
            <p className="text-sm text-destructive">
              {error === "auth_failed"
                ? t("errorAuth")
                : t("errorGeneric")}
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleConnect}>
            {t("tryAgain")}
          </Button>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <p className="font-medium">{t("bankConnection")}</p>
            <p className="text-sm text-muted-foreground">{t("poweredBy")}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" />{t("readOnly")}</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" />{t("encrypted")}</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" />{t("disconnectAnytime")}</li>
        </ul>
        <Button variant="accent" className="w-full" onClick={handleConnect}>
          {t("connectButton")}
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </Card>

      {/* Value preview — what users typically find */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wider">
          {t("whatUsersSave")}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-success/5 border border-success/10 text-center">
            <p className="text-lg font-bold text-success">£42</p>
            <p className="text-[10px] text-muted-foreground">{t("avgMonthly")}</p>
          </div>
          <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-center">
            <p className="text-lg font-bold text-accent">3</p>
            <p className="text-[10px] text-muted-foreground">{t("unusedSubs")}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 border border-border/50 text-center">
            <p className="text-lg font-bold">90s</p>
            <p className="text-[10px] text-muted-foreground">{t("avgTime")}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t("legal")}
      </p>
    </div>
  );
}
