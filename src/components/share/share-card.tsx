"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Share2, Copy, Check, Link2, PiggyBank, Users } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  savings: number;
  issuesFixed: number;
  currency?: string;
  showReferral?: boolean;
}

export function ShareCard({ savings, issuesFixed, currency = "GBP", showReferral = true }: Props) {
  const t = useTranslations("share");
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  const [referral, setReferral] = useState<{ link: string; totalInvited: number } | null>(null);

  const shareText = t("shareText", { amount: formatCurrency(savings, currency), count: issuesFixed });

  useEffect(() => {
    if (showReferral) {
      fetch("/api/referral")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => data && setReferral(data))
        .catch(() => {});
    }
  }, [showReferral]);

  const trackShare = (method: string) => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "share_card_used", metadata: { savings, issuesFixed, method } }),
    }).catch(() => {});
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    trackShare("copy");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        trackShare("native");
      } catch { handleCopy(); }
    } else {
      handleCopy();
    }
  };

  const handleRefCopy = async () => {
    if (!referral) return;
    await navigator.clipboard.writeText(referral.link);
    setRefCopied(true);
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "referral_link_copied" as string }),
    }).catch(() => {});
    setTimeout(() => setRefCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-accent/15">
      <div className="h-0.5 bg-gradient-to-r from-accent/60 to-success/60" />
      <div className="p-6 space-y-5">
        {/* Hero value */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
            <PiggyBank size={22} className="text-success" />
          </div>
          <p className="text-4xl font-bold text-success tracking-tight">
            {formatCurrency(savings, currency)}
          </p>
          <p className="text-sm text-muted-foreground">{t("savedPerYear")}</p>
          <Badge variant="outline" className="text-xs">
            {t("issuesFixed", { count: issuesFixed })}
          </Badge>
        </div>

        {/* Share text preview */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
          <p className="text-sm text-center italic text-muted-foreground leading-relaxed">
            &ldquo;{shareText}&rdquo;
          </p>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2 justify-center">
          <Button variant="accent" onClick={handleShare} className="flex-1 max-w-[160px]">
            <Share2 size={15} className="mr-2" />{tc("share")}
          </Button>
          <Button variant="outline" onClick={handleCopy} className="flex-1 max-w-[160px]">
            {copied
              ? <><Check size={15} className="mr-2" />{tc("copied")}</>
              : <><Copy size={15} className="mr-2" />{tc("copy")}</>
            }
          </Button>
        </div>

        {/* Referral section */}
        {showReferral && referral && (
          <div className="pt-3 border-t border-border/30 space-y-3">
            <div className="flex items-center gap-2 justify-center">
              <Users size={14} className="text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("inviteFriends")}
              </p>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {t("referralDesc")}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border/30 text-xs font-mono truncate flex items-center">
                <Link2 size={12} className="mr-2 flex-shrink-0 text-muted-foreground" />
                {referral.link}
              </div>
              <Button variant="outline" size="sm" onClick={handleRefCopy}>
                {refCopied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            {referral.totalInvited > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                {t("invited", { count: referral.totalInvited })}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
