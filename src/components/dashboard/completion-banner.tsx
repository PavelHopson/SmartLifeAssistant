"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, PiggyBank, Heart, CheckCircle } from "lucide-react";
import type { CompletionFeedback } from "@/lib/services/completion-feedback";

const icons = {
  savings: PiggyBank,
  health: Heart,
  tasks: CheckCircle,
  mixed: Trophy,
};

const colors = {
  savings: "text-success",
  health: "text-red-500",
  tasks: "text-accent",
  mixed: "text-warning",
};

export function CompletionBanner() {
  const [feedback, setFeedback] = useState<CompletionFeedback | null>(null);

  useEffect(() => {
    fetch("/api/completion-feedback")
      .then((r) => r.json())
      .then((d) => setFeedback(d.feedback))
      .catch(() => {});
  }, []);

  if (!feedback) return null;

  const Icon = icons[feedback.type];
  const color = colors[feedback.type];

  return (
    <Card className="bg-success/5 border-success/20">
      <CardContent className="p-4 flex items-start gap-3">
        <Icon size={20} className={color} />
        <div className="flex-1">
          <p className="text-sm font-medium">{feedback.headline}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{feedback.detail}</p>
        </div>
        {feedback.metric && (
          <span className="text-lg font-bold text-success flex-shrink-0">
            {feedback.metric}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
