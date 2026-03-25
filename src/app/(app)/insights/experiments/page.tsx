"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, FlaskConical } from "lucide-react";

interface VariantResult {
  variant: string;
  assignments: number;
  remindersSent: number;
  remindersActedOn: number;
  completionsAfterReminder: number;
  conversionRate: number;
}

interface ExperimentResult {
  experimentName: string;
  variants: VariantResult[];
}

export default function ExperimentsPage() {
  const t = useTranslations("experiments");
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/experiments/results")
      .then((r) => r.json())
      .then((data) => setResults(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {results.length === 0 && (
        <Card className="p-8 text-center">
          <FlaskConical size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">{t("noData")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("noDataHint")}</p>
        </Card>
      )}

      {results.map((exp) => {
        const maxConversion = Math.max(...exp.variants.map((v) => v.conversionRate), 0.01);
        return (
          <Card key={exp.experimentName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical size={18} />
                {exp.experimentName.replace(/_/g, " ")}
              </CardTitle>
              <CardDescription>
                {exp.variants.reduce((s, v) => s + v.assignments, 0)} total assignments
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6 space-y-4">
              {exp.variants.map((v) => (
                <div key={v.variant} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.conversionRate >= maxConversion * 0.9 ? "success" : "default"}>
                        {v.variant}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {v.assignments} {t("users")}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {(v.conversionRate * 100).toFixed(1)}% {t("conversion")}
                    </span>
                  </div>
                  <Progress value={v.conversionRate * 100} />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{t("remindersSent")}: {v.remindersSent}</span>
                    <span>{t("opened")}: {v.remindersActedOn}</span>
                    <span>{t("completedLabel")}: {v.completionsAfterReminder}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
