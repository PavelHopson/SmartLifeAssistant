"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ActionListItem } from "@/components/actions/action-list-item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShareCard } from "@/components/share/share-card";
import { formatCurrency } from "@/lib/utils";
import { mockActions } from "@/lib/services/mock-data";
import type { ActionCardView, AiActionStatus } from "@/lib/domain/types";
import { Zap, CheckCircle } from "lucide-react";

export default function ActionsPage() {
  const t = useTranslations("actions");
  const [actions, setActions] = useState<ActionCardView[]>(mockActions);

  const pending = actions.filter((a) => a.status === "pending_user");
  const confirmed = actions.filter(
    (a) => a.status === "confirmed" || a.status === "done"
  );
  const totalImpact = actions
    .filter((a) => a.status !== "done")
    .reduce((sum, a) => sum + (a.impactAmount || 0), 0);
  const doneCount = actions.filter((a) => a.status === "done").length;
  const progressPercent =
    actions.length > 0 ? (doneCount / actions.length) * 100 : 0;

  const allDone = pending.length === 0;

  const handleConfirm = (id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "confirmed" as AiActionStatus } : a
      )
    );
    // In production: POST /api/actions/confirm { actionId }
  };

  const handleConfirmAll = () => {
    setActions((prev) =>
      prev.map((a) =>
        a.status === "pending_user"
          ? { ...a, status: "confirmed" as AiActionStatus }
          : a
      )
    );
    // In production: POST /api/actions/confirm {}
  };

  const handleExecuteAll = () => {
    setActions((prev) =>
      prev.map((a) =>
        a.status === "confirmed"
          ? { ...a, status: "done" as AiActionStatus }
          : a
      )
    );
    // In production: POST /api/actions/execute
  };

  const handleDismiss = (id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "expired" as AiActionStatus } : a
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("subtitle")}
        </p>
      </div>

      {/* Progress section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-accent" />
            <span className="font-medium">
              {t("issuesFixed", { done: doneCount, total: actions.length })}
            </span>
          </div>
          {totalImpact > 0 && (
            <span className="text-sm text-success font-medium">
              {t("potentialSavings", { amount: formatCurrency(totalImpact) })}
            </span>
          )}
        </div>
        <Progress value={progressPercent} />
      </Card>

      {/* Confirm All CTA */}
      {pending.length > 0 && (
        <div className="flex gap-3">
          <Button variant="accent" className="flex-1" onClick={handleConfirmAll}>
            <CheckCircle size={16} className="mr-2" />
            {t("confirmAll", { count: pending.length })}
          </Button>
        </div>
      )}

      {/* Execute confirmed */}
      {confirmed.length > 0 &&
        pending.length === 0 &&
        confirmed.some((a) => a.status === "confirmed") && (
          <Button variant="accent" className="w-full" onClick={handleExecuteAll}>
            <Zap size={16} className="mr-2" />
            {t("executeAll")}
          </Button>
        )}

      {/* Actions list */}
      <div className="space-y-3">
        {actions
          .filter((a) => a.status !== "expired")
          .map((action) => (
            <ActionListItem
              key={action.id}
              action={action}
              onConfirm={handleConfirm}
              onDismiss={handleDismiss}
            />
          ))}
      </div>

      {/* Share card when all done */}
      {allDone && doneCount > 0 && (
        <ShareCard
          savings={actions.reduce((sum, a) => sum + (a.impactAmount || 0), 0)}
          issuesFixed={doneCount}
          currency="GBP"
        />
      )}
    </div>
  );
}
