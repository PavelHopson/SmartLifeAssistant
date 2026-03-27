"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ArrowRight, Zap, Clock, Shield, X, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ActionCardView } from "@/lib/domain/types";

interface Props {
  actions: ActionCardView[];
  onClose: () => void;
  onStartTrial?: () => void;
  onUpgrade?: () => void;
}

export function AutopilotPreview({ actions, onClose, onStartTrial, onUpgrade }: Props) {
  const t = useTranslations("autopilotPreview");
  const [loading, setLoading] = useState(false);
  const totalImpact = actions.reduce((sum, a) => sum + (a.impactAmount || 0), 0);
  const timeSaved = actions.length * 5;

  const handleTrial = async () => {
    setLoading(true);
    if (onStartTrial) {
      onStartTrial();
    } else {
      try {
        await fetch("/api/premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start_trial" }),
        });
        window.location.reload();
      } catch {}
    }
    setLoading(false);
  };

  const handleUpgrade = async () => {
    setLoading(true);
    if (onUpgrade) {
      onUpgrade();
    } else {
      try {
        const res = await fetch("/api/stripe/checkout", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (data.url) { window.location.href = data.url; return; }
        }
        // Fallback
        await fetch("/api/premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "upgrade" }),
        });
        window.location.reload();
      } catch {}
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md rounded-2xl border border-border/60 shadow-2xl overflow-hidden mx-4">
        <div className="h-1 bg-gradient-to-r from-accent via-blue-500 to-accent" />

        <div className="p-7 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/15 to-blue-500/15 flex items-center justify-center shadow-sm">
                <Bot size={26} className="text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-xl tracking-tight">{t("title")}</h3>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Value metrics — the most important visual */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-success/5 border border-success/10 text-center">
              <p className="text-2xl font-bold text-success tracking-tight">
                {totalImpact > 0 ? formatCurrency(totalImpact) : `${actions.length}`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {totalImpact > 0 ? t("savedPerYear") : t("actionsAutomatic")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 text-center">
              <p className="text-2xl font-bold text-accent tracking-tight">{timeSaved}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t("minSaved")}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
              <p className="text-2xl font-bold tracking-tight">{actions.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t("actionsAutomatic")}</p>
            </div>
          </div>

          {/* Action list */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("wouldAutomate")}</p>
            {actions.slice(0, 3).map((action) => (
              <div key={action.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                <Zap size={13} className="text-accent flex-shrink-0" />
                <span className="text-sm flex-1 truncate">{action.title}</span>
                {action.impactAmount && (
                  <Badge variant="success" className="text-[10px] px-2">
                    {formatCurrency(action.impactAmount)}/yr
                  </Badge>
                )}
              </div>
            ))}
            {actions.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">+{actions.length - 3} {t("more")}</p>
            )}
          </div>

          {/* Primary CTA */}
          <div className="space-y-2.5">
            <Button
              variant="premium"
              className="w-full"
              size="lg"
              onClick={handleTrial}
              disabled={loading}
            >
              {t("startFreeTrial")}
              <ArrowRight size={16} className="ml-2" />
            </Button>

            <Button
              variant="outline"
              className="w-full"
              size="md"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {t("upgradeDirect")}
            </Button>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Shield size={10} />{t("securePayment")}</span>
            <span className="flex items-center gap-1"><Check size={10} />{t("cancelAnytime")}</span>
            <span className="flex items-center gap-1"><Clock size={10} />{t("noHiddenFees")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
