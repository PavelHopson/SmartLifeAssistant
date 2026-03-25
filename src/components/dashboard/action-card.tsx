"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ActionCardView } from "@/lib/domain/types";
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ActionCard({ action }: { action: ActionCardView }) {
  const t = useTranslations("actionKind");
  const tc = useTranslations("common");
  const ts = useTranslations("savings");

  return (
    <Card className="p-4 flex items-start gap-4">
      <div className="flex-shrink-0 mt-0.5">
        {action.priority <= 1 ? (
          <AlertTriangle size={20} className="text-warning" />
        ) : (
          <CheckCircle size={20} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{action.title}</span>
          <Badge variant={action.priority === 0 ? "destructive" : "default"}>
            {t(action.kind)}
          </Badge>
          {action.impactAmount && (
            <Badge variant="success">
              {formatCurrency(action.impactAmount)}{tc("perYear")}
            </Badge>
          )}
        </div>
        {action.explanation && (
          <p className="text-xs text-muted-foreground italic">{action.explanation}</p>
        )}
      </div>
      <Link href="/actions">
        <Button variant="accent" size="sm">
          {tc("fixNow")}
          <ArrowRight size={14} className="ml-1" />
        </Button>
      </Link>
    </Card>
  );
}
