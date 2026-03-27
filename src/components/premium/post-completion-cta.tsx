"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight } from "lucide-react";
import Link from "next/link";

export function PostCompletionCta({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations("postCompletion");

  return (
    <Card className="overflow-hidden border-accent/15 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-0.5 bg-gradient-to-r from-accent to-blue-500" />
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Bot size={18} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-0.5">{t("title")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("description")}</p>
          </div>
          <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0 p-1">
            ×
          </button>
        </div>
        <div className="flex gap-2 mt-3 ml-12">
          <Link href="/pricing">
            <Button variant="premium" size="sm">
              {t("tryAutopilot")}
              <ArrowRight size={12} className="ml-1" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            {t("notNow")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
