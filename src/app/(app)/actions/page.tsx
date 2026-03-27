"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ActionListItem } from "@/components/actions/action-list-item";
import { GuidedDrawer } from "@/components/actions/guided-drawer";
import { AutopilotBanner } from "@/components/premium/autopilot-banner";
import { AutopilotPreview } from "@/components/premium/autopilot-preview";
import { PostCompletionCta } from "@/components/premium/post-completion-cta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShareCard } from "@/components/share/share-card";
import { formatCurrency } from "@/lib/utils";
import { mockActions } from "@/lib/services/mock-data";
import { usePremium } from "@/hooks/use-premium";
import type { ActionCardView, AiActionStatus } from "@/lib/domain/types";
import type { GuidedExecution } from "@/lib/services/guided-execution";
import { Zap, CheckCircle, Bot, Lock } from "lucide-react";

export default function ActionsPage() {
  const t = useTranslations("actions");
  const { isPremium } = usePremium();
  const [actions, setActions] = useState<ActionCardView[]>(mockActions);
  const [guidedState, setGuidedState] = useState<{ actionId: string; guided: GuidedExecution } | null>(null);
  const [showAutopilotPreview, setShowAutopilotPreview] = useState(false);
  const [showPostCompletion, setShowPostCompletion] = useState(false);

  const pending = actions.filter((a) => a.status === "pending_user");
  const confirmed = actions.filter((a) => a.status === "confirmed" || a.status === "done");
  const totalImpact = actions.filter((a) => a.status !== "done").reduce((sum, a) => sum + (a.impactAmount || 0), 0);
  const doneCount = actions.filter((a) => a.status === "done").length;
  const progressPercent = actions.length > 0 ? (doneCount / actions.length) * 100 : 0;
  const allDone = pending.length === 0;

  const handleConfirm = (id: string) => {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, status: "confirmed" as AiActionStatus } : a));
  };

  const handleConfirmAll = () => {
    setActions((prev) => prev.map((a) => a.status === "pending_user" ? { ...a, status: "confirmed" as AiActionStatus } : a));
  };

  const handleExecuteAll = () => {
    if (!isPremium) {
      setShowAutopilotPreview(true);
      fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "execute_all_premium_gate" }) }).catch(() => {});
      return;
    }
    setActions((prev) => prev.map((a) => a.status === "confirmed" ? { ...a, status: "done" as AiActionStatus } : a));
  };

  const handleDismiss = (id: string) => {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, status: "expired" as AiActionStatus } : a));
  };

  const handleMarkDone = useCallback((id: string) => {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, status: "done" as AiActionStatus } : a));
    setGuidedState(null);
    fetch("/api/actions/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionId: id }) }).catch(() => {});
    // Show post-completion CTA for free users
    if (!isPremium) {
      setTimeout(() => setShowPostCompletion(true), 500);
    }
  }, [isPremium]);

  const handleSnooze = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
    setGuidedState(null);
    fetch("/api/actions/snooze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionId: id, hours: 24 }) }).catch(() => {});
  }, []);

  const handleOpenGuide = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/actions/guided?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setGuidedState({ actionId: id, guided: data.guided });
        return;
      }
    } catch {}
    const action = actions.find((a) => a.id === id);
    if (action) {
      const { getGuidedExecution } = await import("@/lib/services/guided-execution");
      const guided = getGuidedExecution(action.kind, { title: action.title, summary: action.summary, explanation: action.explanation, impactAmount: action.impactAmount, sourceType: action.sourceType });
      setGuidedState({ actionId: id, guided });
    }
  }, [actions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {/* Progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-accent" />
            <span className="font-medium">{t("issuesFixed", { done: doneCount, total: actions.length })}</span>
          </div>
          {totalImpact > 0 && (
            <span className="text-sm text-success font-medium">{t("potentialSavings", { amount: formatCurrency(totalImpact) })}</span>
          )}
        </div>
        <Progress value={progressPercent} />
      </Card>

      {/* Post-completion CTA */}
      {showPostCompletion && !isPremium && (
        <PostCompletionCta onDismiss={() => setShowPostCompletion(false)} />
      )}

      {/* Confirm All */}
      {pending.length > 0 && (
        <div className="flex gap-3">
          <Button variant="accent" className="flex-1" onClick={handleConfirmAll}>
            <CheckCircle size={16} className="mr-2" />
            {t("confirmAll", { count: pending.length })}
          </Button>
        </div>
      )}

      {/* Execute All — gated for free users */}
      {confirmed.length > 0 && pending.length === 0 && confirmed.some((a) => a.status === "confirmed") && (
        <Button
          variant={isPremium ? "accent" : "premium"}
          className="w-full"
          onClick={handleExecuteAll}
        >
          {isPremium ? (
            <><Zap size={16} className="mr-2" />{t("executeAll")}</>
          ) : (
            <><Bot size={16} className="mr-2" />{t("executeAutopilot")}</>
          )}
        </Button>
      )}

      {/* Autopilot hint for free users with pending actions */}
      {pending.length >= 2 && !isPremium && (
        <AutopilotBanner variant="compact" actionsCount={pending.length} savingsAmount={totalImpact} />
      )}

      {/* Actions list */}
      <div className="space-y-3">
        {actions.filter((a) => a.status !== "expired").map((action) => (
          <ActionListItem key={action.id} action={action} onConfirm={handleConfirm} onDismiss={handleDismiss} onOpenGuide={handleOpenGuide} onSnooze={handleSnooze} />
        ))}
      </div>

      {/* Share card */}
      {allDone && doneCount > 0 && (
        <ShareCard savings={actions.reduce((sum, a) => sum + (a.impactAmount || 0), 0)} issuesFixed={doneCount} currency="GBP" />
      )}

      {/* Guided drawer */}
      {guidedState && (
        <GuidedDrawer actionId={guidedState.actionId} guided={guidedState.guided} onMarkDone={handleMarkDone} onSnooze={handleSnooze} onClose={() => setGuidedState(null)} />
      )}

      {/* Autopilot preview modal */}
      {showAutopilotPreview && (
        <AutopilotPreview actions={confirmed.filter((a) => a.status === "confirmed")} onClose={() => setShowAutopilotPreview(false)} />
      )}
    </div>
  );
}
