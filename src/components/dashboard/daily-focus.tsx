"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Zap,
  Heart,
  CheckSquare,
  Bell,
  ArrowRight,
  Trophy,
} from "lucide-react";
import type { FocusItem, DailyFocus } from "@/lib/services/daily-focus";
import type { StreakInfo } from "@/lib/services/streaks";

const typeIcon: Record<string, typeof Zap> = {
  money: Zap,
  health: Heart,
  task: CheckSquare,
  reminder: Bell,
};

const typeColor: Record<string, string> = {
  money: "text-accent",
  health: "text-red-500",
  task: "text-orange-500",
  reminder: "text-blue-500",
};

export function DailyFocusBlock() {
  const t = useTranslations("focus");
  const [focus, setFocus] = useState<DailyFocus | null>(null);

  useEffect(() => {
    fetch("/api/daily-focus")
      .then((r) => r.json())
      .then(setFocus)
      .catch(() => {});
  }, []);

  if (!focus) return null;

  // All clear — nothing to focus on
  if (focus.items.length === 0 && focus.completedToday === 0) return null;

  // Everything done today — show celebration + streak
  if (focus.items.length === 0 && focus.completedToday > 0) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Trophy size={20} className="text-success" />
          <div>
            <span className="text-sm font-medium">{t("allDone")}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {t("completedCount", { count: focus.completedToday })}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target size={16} className="text-accent" />
          {t("title")}
          {focus.completedToday > 0 && (
            <Badge variant="success" className="ml-auto">
              {t("completedCount", { count: focus.completedToday })}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {focus.items.map((item, i) => (
          <FocusItemRow key={item.entityId || i} item={item} isPrimary={i === 0} />
        ))}
        {focus.bestStreak && focus.bestStreak.currentStreak >= 2 && (
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <Trophy size={12} className="text-warning" />
            <span>{focus.bestStreak.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FocusItemRow({ item, isPrimary }: { item: FocusItem; isPrimary: boolean }) {
  const tc = useTranslations("common");
  const Icon = typeIcon[item.type] || Zap;
  const color = typeColor[item.type] || "text-muted-foreground";

  return (
    <Link href={item.href}>
      <div
        className={`flex items-center gap-3 p-2.5 rounded-md transition-colors hover:bg-muted/50 ${
          isPrimary ? "bg-muted/30 border border-border" : ""
        }`}
      >
        <Icon size={16} className={color} />
        <div className="flex-1 min-w-0">
          <span className={`text-sm ${isPrimary ? "font-medium" : ""}`}>{item.title}</span>
          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
        </div>
        {item.impact && (
          <Badge variant="success" className="flex-shrink-0 text-xs">
            {item.impact}
          </Badge>
        )}
        <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  );
}
