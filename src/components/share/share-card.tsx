"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";

export function ShareCard({ savings, issuesFixed, currency }: { savings: number; issuesFixed: number; currency: string }) {
  const t = useTranslations("share");
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);

  const shareText = t("shareText", { amount: formatCurrency(savings, currency), count: issuesFixed });

  const trackShare = () => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "share_card_used", metadata: { savings, issuesFixed } }),
    }).catch(() => {});
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    trackShare();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: shareText });
      trackShare();
    } else {
      handleCopy();
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-accent/5 to-success/5 border-accent/20">
      <div className="text-center space-y-4">
        <div className="space-y-1">
          <p className="text-3xl font-bold text-accent">{formatCurrency(savings, currency)}</p>
          <p className="text-sm text-muted-foreground">{t("savedPerYear")}</p>
        </div>
        <p className="text-sm font-medium">
          {t("issuesFixed", { count: issuesFixed })}
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="accent" onClick={handleShare}>
            <Share2 size={16} className="mr-2" />{tc("share")}
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <><Check size={16} className="mr-2" />{tc("copied")}</> : <><Copy size={16} className="mr-2" />{tc("copy")}</>}
          </Button>
        </div>
      </div>
    </Card>
  );
}
