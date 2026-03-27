"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Droplets, Dumbbell, CheckSquare, Zap } from "lucide-react";
import type { StreakInfo, UserStreaks } from "@/lib/services/streaks";

const streakIcons: Record<string, typeof Flame> = {
  hydration: Droplets,
  workout: Dumbbell,
  task_completion: CheckSquare,
  action_completion: Zap,
};

const streakColors: Record<string, string> = {
  hydration: "text-blue-500",
  workout: "text-orange-500",
  task_completion: "text-green-500",
  action_completion: "text-accent",
};

export function StreakBlock() {
  const t = useTranslations("streaks");
  const [data, setData] = useState<UserStreaks | null>(null);

  useEffect(() => {
    fetch("/api/streaks")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.streaks.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame size={16} className="text-orange-500" />
          {t("keepItUp")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {data.streaks.map((streak) => (
            <StreakItem key={streak.type} streak={streak} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StreakItem({ streak }: { streak: StreakInfo }) {
  const Icon = streakIcons[streak.type] || Flame;
  const color = streakColors[streak.type] || "text-muted-foreground";

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
      <Icon size={16} className={color} />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground truncate block">{streak.label}</span>
      </div>
      {streak.currentStreak >= 3 && (
        <Badge variant="warning" className="text-[10px] px-1.5 py-0">
          {streak.currentStreak}
        </Badge>
      )}
    </div>
  );
}
