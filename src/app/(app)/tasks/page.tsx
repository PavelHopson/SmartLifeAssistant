"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockTasks, type MockTask } from "@/lib/services/mock-data";
import {
  CheckCircle,
  Circle,
  Clock,
  Pin,
  Plus,
  Sparkles,
  AlertTriangle,
  BellOff,
} from "lucide-react";

const priorityKey: Record<number, string> = { 0: "urgent", 1: "high", 2: "normal" };
const priorityVariant: Record<number, "destructive" | "warning" | "default"> = { 0: "destructive", 1: "warning", 2: "default" };

function getDueState(dueAt: string | null, status: string): "overdue" | "due-today" | "due-soon" | null {
  if (!dueAt || status === "done") return null;
  const now = new Date();
  const due = new Date(dueAt);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) return "overdue";
  if (diffHours < 24) return "due-today";
  if (diffHours < 72) return "due-soon";
  return null;
}

const dueVariants = {
  overdue: { variant: "destructive" as const, icon: AlertTriangle },
  "due-today": { variant: "warning" as const, icon: Clock },
  "due-soon": { variant: "default" as const, icon: Clock },
};

export default function TasksPage() {
  const t = useTranslations("tasks");
  const tPriority = useTranslations("priority");
  const tc = useTranslations("common");

  const [tasks, setTasks] = useState<MockTask[]>(mockTasks);
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = tasks.filter((t) => {
    if (filter === "all") return t.status !== "archived";
    if (filter === "overdue") return getDueState(t.dueAt, t.status) === "overdue";
    return t.status === filter;
  });

  const stats = {
    total: tasks.filter((t) => t.status !== "archived").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => getDueState(t.dueAt, t.status) === "overdue").length,
  };
  const progress = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  const handleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "done" } : t))
    );
  };

  const handleSnooze = (id: string) => {
    // Snooze for 24 hours — in production: POST /api/tasks with snooze action
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, dueAt: tomorrow.toISOString().split("T")[0] }
          : t
      )
    );
  };

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `t${Date.now()}`,
        title: newTitle.trim(),
        description: null,
        status: "open",
        priority: 2,
        dueAt: null,
        aiGenerated: false,
        pinned: false,
        sourceType: null,
      },
    ]);
    setNewTitle("");
  };

  const dueStateLabel = (state: "overdue" | "due-today" | "due-soon") => {
    if (state === "overdue") return tc("overdue");
    if (state === "due-today") return tc("dueToday");
    return tc("dueSoon");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">
          {stats.overdue > 0
            ? `${stats.overdue} ${t("overdue")} · ${t("completed", { done: stats.done, total: stats.total })}`
            : t("completed", { done: stats.done, total: stats.total })}
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {t("completed", { done: stats.done, total: stats.total })}
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </Card>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: t("filterAll") },
          { key: "open", label: t("filterOpen") },
          { key: "in_progress", label: t("filterInProgress") },
          { key: "overdue", label: `${t("filterOverdue")}${stats.overdue > 0 ? ` (${stats.overdue})` : ""}` },
          { key: "done", label: t("filterDone") },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t("addPlaceholder")}
          className="flex-1 h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
        />
        <Button variant="accent" size="md" onClick={handleAddTask}>
          <Plus size={16} />
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map((task) => {
          const dueState = getDueState(task.dueAt, task.status);
          const dueInfo = dueState ? dueVariants[dueState] : null;

          return (
            <Card
              key={task.id}
              className={`p-4 ${task.status === "done" ? "opacity-50" : ""} ${
                dueState === "overdue" ? "border-destructive/40" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleComplete(task.id)}
                  className="mt-0.5 flex-shrink-0"
                  disabled={task.status === "done"}
                >
                  {task.status === "done" ? (
                    <CheckCircle size={20} className="text-success" />
                  ) : task.status === "in_progress" ? (
                    <Clock size={20} className="text-accent" />
                  ) : dueState === "overdue" ? (
                    <AlertTriangle size={20} className="text-destructive" />
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-medium ${
                        task.status === "done" ? "line-through" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                    <Badge variant={priorityVariant[task.priority]}>
                      {tPriority(priorityKey[task.priority])}
                    </Badge>
                    {task.aiGenerated && (
                      <Badge variant="outline">
                        <Sparkles size={10} className="mr-1" />
                        {t("ai")}
                      </Badge>
                    )}
                    {dueInfo && dueState && (
                      <Badge variant={dueInfo.variant}>{dueStateLabel(dueState)}</Badge>
                    )}
                    {task.pinned && <Pin size={12} className="text-accent" />}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                  {task.dueAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("due", {
                        date: new Date(task.dueAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        }),
                      })}
                    </p>
                  )}
                </div>

                {dueState && task.status !== "done" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSnooze(task.id)}
                    title="Snooze 24h"
                  >
                    <BellOff size={14} />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("noTasks")}
          </p>
        )}
      </div>
    </div>
  );
}
