"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Check, Bug, Lightbulb, HelpCircle } from "lucide-react";
import type { FeedbackType } from "@/lib/services/feedback";

interface Props {
  screen?: string;
  compact?: boolean;
}

export function FeedbackPrompt({ screen, compact }: Props) {
  const t = useTranslations("feedback");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const types: { key: FeedbackType; icon: typeof Bug; label: string }[] = [
    { key: "bug", icon: Bug, label: t("bug") },
    { key: "suggestion", icon: Lightbulb, label: t("suggestion") },
    { key: "confused", icon: HelpCircle, label: t("confused") },
  ];

  const handleSubmit = async () => {
    if (!type || !message.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim(), screen }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setType(null);
        setMessage("");
      }, 2000);
    } catch {}
    setLoading(false);
  };

  // Compact: just an icon button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`${compact ? "p-2" : "p-3"} rounded-xl bg-muted/50 hover:bg-muted border border-border/30 transition-colors`}
        title={t("title")}
      >
        <MessageCircle size={compact ? 16 : 18} className="text-muted-foreground" />
      </button>
    );
  }

  if (submitted) {
    return (
      <Card className="p-5 text-center space-y-2 border-success/20">
        <Check size={24} className="text-success mx-auto" />
        <p className="text-sm font-medium">{t("thanks")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4 border-accent/15">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("title")}</p>
        <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded-lg">
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Type selection */}
      <div className="flex gap-2">
        {types.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setType(key)}
            className={`flex-1 p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
              type === key
                ? "border-accent bg-accent/5 text-accent"
                : "border-border/30 hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("placeholder")}
        className="w-full h-20 px-3 py-2 rounded-lg border border-border/30 bg-muted/20 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50"
      />

      <Button
        variant="accent"
        size="sm"
        className="w-full"
        onClick={handleSubmit}
        disabled={!type || !message.trim() || loading}
      >
        <Send size={14} className="mr-2" />
        {t("send")}
      </Button>
    </Card>
  );
}
