"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  Clock,
  Target,
  ExternalLink,
  CheckCircle,
  Circle,
  BellOff,
  Pin,
} from "lucide-react";
import type { GuidedExecution } from "@/lib/services/guided-execution";

interface Props {
  actionId: string;
  guided: GuidedExecution;
  onMarkDone: (id: string) => void;
  onSnooze: (id: string) => void;
  onClose: () => void;
}

export function GuidedDrawer({ actionId, guided, onMarkDone, onSnooze, onClose }: Props) {
  const t = useTranslations("guided");
  const tc = useTranslations("common");
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (step: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const allChecked = checkedSteps.size === guided.steps.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto border border-border shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-base">{guided.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {guided.estimatedTime}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Why + outcome */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Target size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("whyItMatters")}</p>
                <p className="text-sm">{guided.whyItMatters}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle size={14} className="text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("expectedOutcome")}</p>
                <p className="text-sm font-medium text-success">{guided.expectedOutcome}</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("steps")}</p>
            <div className="space-y-2">
              {guided.steps.map((step) => (
                <div
                  key={step.step}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    checkedSteps.has(step.step)
                      ? "border-success/30 bg-success/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => toggleStep(step.step)}
                >
                  {checkedSteps.has(step.step) ? (
                    <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${checkedSteps.has(step.step) ? "line-through opacity-60" : ""}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {step.externalUrl && (
                    <a
                      href={step.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 hover:bg-muted rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={14} className="text-accent" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="text-xs text-muted-foreground text-center">
            {checkedSteps.size}/{guided.steps.length} {t("stepsCompleted")}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => onMarkDone(actionId)}
              disabled={!allChecked && !guided.canAutoComplete}
            >
              <CheckCircle size={14} className="mr-1" />
              {t("markDone")}
            </Button>
            <Button variant="outline" size="md" onClick={() => onSnooze(actionId)}>
              <BellOff size={14} className="mr-1" />
              {t("remindLater")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
