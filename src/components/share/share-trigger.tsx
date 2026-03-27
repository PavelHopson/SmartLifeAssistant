"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Gift, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

type TriggerType = "savings" | "completion" | "upgrade" | "streak";

interface Props {
  type: TriggerType;
  savings?: number;
  actionsCompleted?: number;
  streakDays?: number;
  currency?: string;
  onDismiss?: () => void;
}

export function ShareTrigger({ type, savings, actionsCompleted, streakDays, currency = "GBP", onDismiss }: Props) {
  const t = useTranslations("shareTrigger");
  const [shared, setShared] = useState(false);

  const getMessage = () => {
    switch (type) {
      case "savings":
        return t("savingsMsg", { amount: formatCurrency(savings || 0, currency) });
      case "completion":
        return t("completionMsg", { count: actionsCompleted || 0 });
      case "upgrade":
        return t("upgradeMsg");
      case "streak":
        return t("streakMsg", { days: streakDays || 0 });
    }
  };

  const getShareText = () => {
    switch (type) {
      case "savings":
        return t("savingsShare", { amount: formatCurrency(savings || 0, currency) });
      case "completion":
        return t("completionShare", { count: actionsCompleted || 0 });
      case "upgrade":
        return t("upgradeShare");
      case "streak":
        return t("streakShare", { days: streakDays || 0 });
    }
  };

  const handleShare = async () => {
    const text = getShareText();
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "share_card_used", metadata: { type, savings, actionsCompleted } }),
    }).catch(() => {});

    if (navigator.share) {
      try {
        await navigator.share({ text });
        setShared(true);
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setShared(true);
    }
    setTimeout(() => setShared(false), 3000);
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-accent/5 to-success/5 border border-accent/10 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Gift size={18} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{getMessage()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("tellFriends")}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button variant="accent" size="sm" onClick={handleShare}>
          <Share2 size={14} className="mr-1" />
          {shared ? t("shared") : t("share")}
        </Button>
        {onDismiss && (
          <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground">
            {t("later")}
          </button>
        )}
      </div>
    </div>
  );
}
