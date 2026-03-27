"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PremiumGateProps {
  feature: string;
  description: string;
  children?: React.ReactNode;
  isPremium?: boolean;
}

export function PremiumGate({ feature, description, children, isPremium }: PremiumGateProps) {
  const t = useTranslations("premium");

  if (isPremium) return <>{children}</>;

  return (
    <Card className="relative overflow-hidden border-accent/20">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-blue-500/3" />
      <CardContent className="p-6 relative">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Lock size={18} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{feature}</span>
              <Badge variant="default" className="bg-accent/10 text-accent border-0 text-[10px]">
                <Crown size={10} className="mr-1" />
                {t("badge")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            <Link href="/pricing" className="inline-block mt-3">
              <Button variant="premium" size="sm">
                {t("unlock")}
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PremiumBadge() {
  const t = useTranslations("premium");
  return (
    <Badge variant="default" className="bg-gradient-to-r from-accent/10 to-blue-500/10 text-accent border-0 text-[10px]">
      <Crown size={10} className="mr-1" />
      {t("badge")}
    </Badge>
  );
}
