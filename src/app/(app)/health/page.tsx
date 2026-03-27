"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  Dumbbell,
  Footprints,
  Droplets,
  Moon,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Target,
} from "lucide-react";
import type { HealthProfileView, HealthLogView, HealthDashboard, HealthGoal, ActivityLevel } from "@/lib/domain/types";
import { StreakBlock } from "@/components/health/streak-block";

const GOALS: { value: HealthGoal; key: string }[] = [
  { value: "maintain", key: "goalMaintain" },
  { value: "improve_energy", key: "goalEnergy" },
  { value: "lose_weight", key: "goalLoseWeight" },
  { value: "build_habit", key: "goalBuildHabit" },
  { value: "general_health", key: "goalGeneral" },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; key: string }[] = [
  { value: "low", key: "activityLow" },
  { value: "medium", key: "activityMedium" },
  { value: "high", key: "activityHigh" },
];

export default function HealthPage() {
  const t = useTranslations("health");

  const [profile, setProfile] = useState<HealthProfileView | null>(null);
  const [dashboard, setDashboard] = useState<HealthDashboard | null>(null);
  const [logs, setLogs] = useState<HealthLogView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [walkMinutes, setWalkMinutes] = useState(20);
  const [sleepHours, setSleepHours] = useState(7);

  // Form state for profile
  const [form, setForm] = useState<HealthProfileView>({
    goal: "general_health",
    activityLevel: "medium",
    workoutGoalPerWeek: 3,
    waterGoalPerDay: 8,
    sleepGoalHours: 8,
    reminderEnabled: true,
  });

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, logsRes] = await Promise.all([
        fetch("/api/health-profile"),
        fetch("/api/health-logs?limit=10"),
      ]);
      const profileData = await profileRes.json();
      const logsData = await logsRes.json();

      setProfile(profileData.profile);
      setDashboard(profileData.dashboard);
      setLogs(logsData.logs || []);

      if (profileData.profile) {
        setForm(profileData.profile);
        setShowSetup(false);
      } else {
        setShowSetup(true);
      }
    } catch { /* graceful */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveProfile = async () => {
    await fetch("/api/health-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowSetup(false);
    fetchData();
  };

  const quickLog = async (type: string, value: number, unit: string) => {
    await fetch("/api/health-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, value, unit }),
    });
    fetchData();
  };

  const deleteLog = async (id: string) => {
    await fetch(`/api/health-logs?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const generateActions = async () => {
    await fetch("/api/health-actions", { method: "POST" });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        {t("title")}...
      </div>
    );
  }

  // Setup screen
  if (showSetup || !profile) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="text-center">
          <Heart className="mx-auto mb-3 text-accent" size={40} />
          <h1 className="text-2xl font-semibold mb-1">{t("setupTitle")}</h1>
          <p className="text-muted-foreground text-sm">{t("setupSubtitle")}</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Goal */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t("goal")}</label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => (
                  <Button
                    key={g.value}
                    variant={form.goal === g.value ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => setForm({ ...form, goal: g.value })}
                  >
                    {t(g.key)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Activity level */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t("activityLevel")}</label>
              <div className="flex gap-2">
                {ACTIVITY_LEVELS.map((l) => (
                  <Button
                    key={l.value}
                    variant={form.activityLevel === l.value ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setForm({ ...form, activityLevel: l.value })}
                  >
                    {t(l.key)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Number targets */}
            <div className="grid grid-cols-3 gap-4">
              <NumberInput
                label={t("workoutGoal")}
                value={form.workoutGoalPerWeek}
                min={0} max={7}
                onChange={(v) => setForm({ ...form, workoutGoalPerWeek: v })}
              />
              <NumberInput
                label={t("waterGoal")}
                value={form.waterGoalPerDay}
                min={1} max={20}
                onChange={(v) => setForm({ ...form, waterGoalPerDay: v })}
              />
              <NumberInput
                label={t("sleepGoal")}
                value={form.sleepGoalHours}
                min={4} max={12}
                onChange={(v) => setForm({ ...form, sleepGoalHours: v })}
              />
            </div>

            {/* Reminders */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.reminderEnabled}
                onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })}
                className="rounded"
              />
              {t("reminders")}
            </label>

            <Button variant="accent" className="w-full" onClick={saveProfile}>
              {profile ? t("updateProfile") : t("saveProfile")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main health view
  const workoutProgress = dashboard
    ? (dashboard.workoutsThisWeek / dashboard.workoutGoal) * 100
    : 0;
  const waterProgress = dashboard
    ? (dashboard.waterToday / dashboard.waterGoal) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSetup(true)}>
          <Target size={14} className="mr-1" /> {t("updateProfile")}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Dumbbell size={18} />}
          label={t("workoutsThisWeek")}
          value={`${dashboard?.workoutsThisWeek || 0}/${dashboard?.workoutGoal || 0}`}
          progress={workoutProgress}
          color="text-orange-500"
        />
        <StatCard
          icon={<Droplets size={18} />}
          label={t("waterToday")}
          value={`${dashboard?.waterToday || 0}/${dashboard?.waterGoal || 0}`}
          progress={waterProgress}
          color="text-blue-500"
        />
        <StatCard
          icon={<Moon size={18} />}
          label={t("lastSleep")}
          value={dashboard?.lastSleepHours != null ? `${dashboard.lastSleepHours}h` : "—"}
          progress={dashboard?.lastSleepHours != null ? (dashboard.lastSleepHours / dashboard.sleepGoal) * 100 : 0}
          color="text-indigo-500"
        />
        <StatCard
          icon={<Sparkles size={18} />}
          label={t("healthActions")}
          value={String(dashboard?.pendingHealthActions || 0)}
          color="text-accent"
        />
      </div>

      <StreakBlock />

      {/* Quick log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("logTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => quickLog("workout", 1, "session")}>
              <Dumbbell size={20} className="text-orange-500" />
              <span className="text-xs">{t("addWorkout")}</span>
            </Button>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <Button variant="ghost" size="sm" onClick={() => setWalkMinutes(Math.max(5, walkMinutes - 5))}>
                  <Minus size={12} />
                </Button>
                <span className="text-sm font-medium w-8 text-center">{walkMinutes}</span>
                <Button variant="ghost" size="sm" onClick={() => setWalkMinutes(Math.min(120, walkMinutes + 5))}>
                  <Plus size={12} />
                </Button>
              </div>
              <Button variant="outline" className="w-full h-auto py-2 flex-col gap-1" onClick={() => quickLog("walk", walkMinutes, "minutes")}>
                <Footprints size={20} className="text-green-500" />
                <span className="text-xs">{walkMinutes} {t("minutes")}</span>
              </Button>
            </div>

            <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => quickLog("water", 1, "glasses")}>
              <Droplets size={20} className="text-blue-500" />
              <span className="text-xs">{t("addWater")}</span>
            </Button>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <Button variant="ghost" size="sm" onClick={() => setSleepHours(Math.max(3, sleepHours - 0.5))}>
                  <Minus size={12} />
                </Button>
                <span className="text-sm font-medium w-8 text-center">{sleepHours}</span>
                <Button variant="ghost" size="sm" onClick={() => setSleepHours(Math.min(12, sleepHours + 0.5))}>
                  <Plus size={12} />
                </Button>
              </div>
              <Button variant="outline" className="w-full h-auto py-2 flex-col gap-1" onClick={() => quickLog("sleep", sleepHours, "hours")}>
                <Moon size={20} className="text-indigo-500" />
                <span className="text-xs">{sleepHours}h</span>
              </Button>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={generateActions}>
            <Sparkles size={14} className="mr-1" />
            {t("healthActions")}
          </Button>
        </CardContent>
      </Card>

      {/* Recent logs */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t("recentLogs")}</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("noLogs")}</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogIcon type={log.type} />
                    <div>
                      <span className="text-sm font-medium">{t(`log${capitalize(log.type)}`)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {log.value} {t(log.unit === "session" ? "sessions" : log.unit)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.loggedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => deleteLog(log.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, progress, color }: {
  icon: React.ReactNode; label: string; value: string; progress?: number; color?: string;
}) {
  return (
    <Card className="p-4">
      <div className={`flex items-center gap-2 mb-2 ${color || ""}`}>
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-semibold">{value}</div>
      {progress !== undefined && (
        <Progress value={Math.min(100, progress)} className="mt-2 h-1.5" />
      )}
    </Card>
  );
}

function NumberInput({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onChange(Math.max(min, value - 1))}>
          <Minus size={12} />
        </Button>
        <span className="text-sm font-medium w-6 text-center">{value}</span>
        <Button variant="outline" size="sm" onClick={() => onChange(Math.min(max, value + 1))}>
          <Plus size={12} />
        </Button>
      </div>
    </div>
  );
}

function LogIcon({ type }: { type: string }) {
  switch (type) {
    case "workout": return <Dumbbell size={16} className="text-orange-500" />;
    case "walk": return <Footprints size={16} className="text-green-500" />;
    case "water": return <Droplets size={16} className="text-blue-500" />;
    case "sleep": return <Moon size={16} className="text-indigo-500" />;
    default: return <Heart size={16} />;
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
