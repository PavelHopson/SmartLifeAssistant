"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, ArrowRight, Bot, Sparkles } from "lucide-react";
import Link from "next/link";

export function UpgradeSuccess() {
  const t = useTranslations("upgradeSuccess");

  return (
    <Card className="overflow-hidden border-success/20">
      <div className="h-1 bg-gradient-to-r from-success to-emerald-400" />
      <CardContent className="p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
          <Crown size={28} className="text-success" />
        </div>

        <div>
          <Badge variant="success" className="mb-3 text-sm px-4 py-1">
            <Sparkles size={12} className="mr-1" />
            {t("badge")}
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{t("subtitle")}</p>
        </div>

        <div className="space-y-2 text-left max-w-xs mx-auto">
          {[t("unlock1"), t("unlock2"), t("unlock3"), t("unlock4")].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <Check size={14} className="text-success flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Link href="/actions" className="block">
          <Button variant="accent" size="lg" className="w-full max-w-xs">
            <Bot size={16} className="mr-2" />
            {t("tryAutopilot")}
            <ArrowRight size={14} className="ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
