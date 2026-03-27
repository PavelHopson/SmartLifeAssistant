"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, Dumbbell, Droplets, Moon, ArrowRight } from "lucide-react";
import type { HealthDashboard } from "@/lib/domain/types";

export function HealthBlock() {
  const t = useTranslations("health");
  const [data, setData] = useState<HealthDashboard | null>(null);

  useEffect(() => {
    fetch("/api/health-profile")
      .then((r) => r.json())
      .then((d) => setData(d.dashboard))
      .catch(() => {});
  }, []);

  if (!data) return null;

  // No profile — show setup CTA
  if (!data.hasProfile) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("noProfile")}</span>
          </div>
          <Link href="/health">
            <Button variant="outline" size="sm">
              {t("setupCta")}
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const workoutPct = Math.min(100, (data.workoutsThisWeek / data.workoutGoal) * 100);
  const waterPct = Math.min(100, (data.waterToday / data.waterGoal) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart size={16} className="text-red-500" />
          {t("dashboardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <MiniStat
            icon={<Dumbbell size={14} className="text-orange-500" />}
            label={`${data.workoutsThisWeek}/${data.workoutGoal}`}
            progress={workoutPct}
          />
          <MiniStat
            icon={<Droplets size={14} className="text-blue-500" />}
            label={`${data.waterToday}/${data.waterGoal}`}
            progress={waterPct}
          />
          <MiniStat
            icon={<Moon size={14} className="text-indigo-500" />}
            label={data.lastSleepHours != null ? `${data.lastSleepHours}h` : "—"}
            progress={data.lastSleepHours != null ? Math.min(100, (data.lastSleepHours / data.sleepGoal) * 100) : 0}
          />
        </div>

        {data.pendingHealthActions > 0 && (
          <Link href="/actions" className="text-xs text-accent hover:underline">
            {data.pendingHealthActions} {t("healthActions").toLowerCase()} →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon, label, progress }: {
  icon: React.ReactNode; label: string; progress: number;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );
}
