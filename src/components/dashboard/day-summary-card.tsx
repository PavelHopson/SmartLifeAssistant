"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Sunrise, CheckCircle, Droplets, Dumbbell, Flame } from "lucide-react";
import type { DaySummary } from "@/lib/services/end-of-day-summary";

export function DaySummaryCard() {
  const t = useTranslations("daySummary");
  const [summary, setSummary] = useState<DaySummary | null>(null);

  useEffect(() => {
    fetch("/api/end-of-day")
      .then((r) => r.json())
      .then((d) => setSummary(d.summary))
      .catch(() => {});
  }, []);

  if (!summary || !summary.meaningful) return null;

  const items: { icon: typeof CheckCircle; text: string; color: string }[] = [];

  if (summary.actionsCompleted > 0) {
    items.push({
      icon: CheckCircle,
      text: t("actionsDone", { count: summary.actionsCompleted }),
      color: "text-success",
    });
  }
  if (summary.tasksCompleted > 0) {
    items.push({
      icon: CheckCircle,
      text: t("tasksDone", { count: summary.tasksCompleted }),
      color: "text-accent",
    });
  }
  if (summary.savingsToday > 0) {
    items.push({
      icon: Flame,
      text: t("savedToday", { amount: `£${Math.round(summary.savingsToday)}` }),
      color: "text-success",
    });
  }
  if (summary.waterMet) {
    items.push({ icon: Droplets, text: t("waterGoalMet"), color: "text-blue-500" });
  }
  if (summary.workoutDone) {
    items.push({ icon: Dumbbell, text: t("workoutDone"), color: "text-orange-500" });
  }
  if (summary.openTasks > 0 && items.length > 0) {
    items.push({
      icon: Sunrise,
      text: t("stillOpen", { count: summary.openTasks }),
      color: "text-muted-foreground",
    });
  }

  if (items.length === 0) return null;

  return (
    <Card className="bg-muted/20">
      <CardContent className="p-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {items.slice(0, 4).map((item, i) => {
            const Icon = item.icon;
            return (
              <span key={i} className={`flex items-center gap-1.5 text-xs ${item.color}`}>
                <Icon size={12} />
                {item.text}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
