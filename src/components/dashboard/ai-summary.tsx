"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { PiggyBank, CheckSquare, Zap, Bell, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SummaryItem {
  icon: "savings" | "task" | "action" | "reminder" | "check";
  text: string;
}

interface Props {
  greeting: string;
  items: SummaryItem[];
  nextStep: string;
  nextStepHref?: string;
}

const iconMap = { savings: PiggyBank, task: CheckSquare, action: Zap, reminder: Bell, check: CheckCircle };
const iconColor = { savings: "text-success", task: "text-warning", action: "text-accent", reminder: "text-warning", check: "text-success" };

export function AiSummary({ greeting, items, nextStep, nextStepHref = "/actions" }: Props) {
  const t = useTranslations("dashboard");

  if (items.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-lg font-semibold">{greeting}</p>
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
          <CheckCircle size={16} className="text-success" />
          {t("allCaughtUp")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      <p className="text-lg font-semibold">{greeting}</p>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const Icon = iconMap[item.icon];
          return (
            <li key={i} className="flex items-center gap-3 text-sm">
              <Icon size={16} className={iconColor[item.icon]} />
              <span>{item.text}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <ArrowRight size={14} className="text-accent" />
        <Link href={nextStepHref} className="text-sm font-medium text-accent hover:underline">
          {nextStep}
        </Link>
      </div>
    </Card>
  );
}
