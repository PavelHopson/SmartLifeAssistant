"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ActionCardView } from "@/lib/domain/types";
import { CheckCircle, AlertTriangle, XCircle, Check } from "lucide-react";

function StatusIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle size={20} className="text-success" />;
  if (status === "confirmed") return <Check size={20} className="text-accent" />;
  if (status === "failed") return <XCircle size={20} className="text-destructive" />;
  return <AlertTriangle size={20} className="text-warning" />;
}

export function ActionListItem({
  action, onConfirm, onDismiss,
}: {
  action: ActionCardView;
  onConfirm?: (id: string) => void;
  onDismiss?: (id: string) => void;
}) {
  const tKind = useTranslations("actionKind");
  const tPriority = useTranslations("priority");
  const tc = useTranslations("common");
  const ts = useTranslations("savings");
  const isDone = action.status === "done" || action.status === "confirmed";

  const priorityKey = action.priority === 0 ? "urgent" : action.priority === 1 ? "high" : "normal";
  const priorityVariant = action.priority === 0 ? "destructive" : action.priority === 1 ? "warning" : "default";

  return (
    <Card className={`p-4 ${isDone ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5"><StatusIcon status={action.status} /></div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{action.title}</span>
            <Badge variant={priorityVariant as "destructive" | "warning" | "default"}>{tPriority(priorityKey)}</Badge>
            <Badge variant="outline">{tKind(action.kind)}</Badge>
          </div>
          {action.summary && <p className="text-sm text-muted-foreground">{action.summary}</p>}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {action.explanation && <span className="italic">{action.explanation}</span>}
            {action.impactAmount && (
              <span className="text-success font-medium">
                {ts("savePerYear", { amount: formatCurrency(action.impactAmount) })}
              </span>
            )}
            <span>{ts("confidence", { score: Math.round(action.confidenceScore * 100) })}</span>
          </div>
        </div>
        {action.status === "pending_user" && (
          <div className="flex gap-2 flex-shrink-0">
            {onDismiss && <Button variant="ghost" size="sm" onClick={() => onDismiss(action.id)}>{tc("skip")}</Button>}
            {onConfirm && <Button variant="accent" size="sm" onClick={() => onConfirm(action.id)}>{tc("fix")}</Button>}
          </div>
        )}
        {action.status === "done" && <Badge variant="success">{tc("completed")}</Badge>}
        {action.status === "confirmed" && <Badge variant="default">{tc("confirmed")}</Badge>}
      </div>
    </Card>
  );
}
