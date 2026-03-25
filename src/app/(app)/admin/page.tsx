"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Server, Zap, Bell, Building2, BarChart3,
  AlertTriangle, CheckCircle, XCircle, Clock,
} from "lucide-react";

interface AdminData {
  jobs: {
    recentRuns: { id: string; type: string; status: string; durationMs: number | null; errorMessage: string | null; completedAt: string | null }[];
    byStatus: Record<string, number>;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
  };
  actions: {
    recentFailures: { id: string; title: string; kind: string; status: string; updatedAt: string }[];
    byStatus: Record<string, number>;
  };
  notifications: {
    recentFailures: { id: string; title: string; channel: string; createdAt: string }[];
    sendCounts: { sent: number; failed: number; pending: number };
  };
  providers: {
    connections: { provider: string; status: string; count: number }[];
  };
  analytics: {
    wowConversion: number;
    actionCompletionRate: number;
    reminderEffectiveness: number;
    totalUsers: number;
    activeUsers7d: number;
  };
  config: Record<string, { configured: boolean; mode?: string }>;
  warnings: string[];
}

const statusIcon = (s: string) => {
  if (s === "done") return <CheckCircle size={14} className="text-success" />;
  if (s === "failed") return <XCircle size={14} className="text-destructive" />;
  if (s === "running") return <Clock size={14} className="text-accent animate-spin" />;
  return <Clock size={14} className="text-muted-foreground" />;
};

export default function AdminPage() {
  const t = useTranslations("admin");
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/status")
      .then((r) => {
        if (r.status === 401) throw new Error("Unauthorized — set CRON_SECRET and pass it as Bearer token, or access in dev mode");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="text-center py-20"><p className="text-destructive text-sm">{error}</p></div>;
  if (!data) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <Card className="p-4 border-warning/40 bg-warning/5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-warning mt-0.5" />
            <div className="space-y-1">
              {data.warnings.map((w, i) => (
                <p key={i} className="text-sm text-warning">{w}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Config Status */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Server size={18} />{t("configuration")}</CardTitle></CardHeader>
        <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(data.config).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              {val.configured ? <CheckCircle size={14} className="text-success" /> : <XCircle size={14} className="text-muted-foreground" />}
              <div>
                <p className="text-xs font-medium">{key}</p>
                {val.mode && <p className="text-[10px] text-muted-foreground">{val.mode}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 size={18} />{t("analytics")}</CardTitle></CardHeader>
        <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: t("totalUsers"), value: data.analytics.totalUsers },
            { label: t("active7d"), value: data.analytics.activeUsers7d },
            { label: t("wowConv"), value: `${(data.analytics.wowConversion * 100).toFixed(0)}%` },
            { label: t("actionCompl"), value: `${(data.analytics.actionCompletionRate * 100).toFixed(0)}%` },
            { label: t("reminderEff"), value: `${(data.analytics.reminderEffectiveness * 100).toFixed(0)}%` },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-xl font-semibold">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap size={18} />{t("recentJobs")}</CardTitle>
          <CardDescription>
            Last success: {data.jobs.lastSuccessAt ? new Date(data.jobs.lastSuccessAt).toLocaleString("en-GB") : "never"}
            {data.jobs.lastFailureAt && ` · Last failure: ${new Date(data.jobs.lastFailureAt).toLocaleString("en-GB")}`}
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-2">
          {data.jobs.recentRuns.slice(0, 10).map((job) => (
            <div key={job.id} className="flex items-center gap-3 text-sm">
              {statusIcon(job.status)}
              <span className="font-mono text-xs w-40 truncate">{job.type}</span>
              <Badge variant={job.status === "done" ? "success" : job.status === "failed" ? "destructive" : "default"}>{job.status}</Badge>
              {job.durationMs && <span className="text-xs text-muted-foreground">{job.durationMs}ms</span>}
              {job.errorMessage && <span className="text-xs text-destructive truncate max-w-40">{job.errorMessage}</span>}
            </div>
          ))}
          {data.jobs.recentRuns.length === 0 && <p className="text-sm text-muted-foreground">{t("noJobs")}</p>}
        </div>
      </Card>

      {/* Action failures */}
      {data.actions.recentFailures.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle size={18} />{t("actionFailures")}</CardTitle></CardHeader>
          <div className="px-6 pb-6 space-y-2">
            {data.actions.recentFailures.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <XCircle size={14} className="text-destructive" />
                <span className="truncate flex-1">{a.title}</span>
                <Badge variant="destructive">{a.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(a.updatedAt).toLocaleDateString("en-GB")}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notification failures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell size={18} />{t("notificationsSection")}</CardTitle>
          <CardDescription>{t("sent")}: {data.notifications.sendCounts.sent} · {t("failed")}: {data.notifications.sendCounts.failed} · Pending: {data.notifications.sendCounts.pending}</CardDescription>
        </CardHeader>
        {data.notifications.recentFailures.length > 0 && (
          <div className="px-6 pb-6 space-y-2">
            {data.notifications.recentFailures.map((n) => (
              <div key={n.id} className="flex items-center gap-3 text-sm">
                <XCircle size={14} className="text-destructive" />
                <span className="truncate flex-1">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.channel}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Providers */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 size={18} />{t("providerConnections")}</CardTitle></CardHeader>
        <div className="px-6 pb-6">
          {data.providers.connections.length > 0 ? (
            <div className="space-y-2">
              {data.providers.connections.map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="capitalize">{p.provider}</span>
                  <Badge variant={p.status === "connected" ? "success" : "warning"}>{p.status}</Badge>
                  <span className="text-xs text-muted-foreground">{p.count} {t("connections")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noProviders")}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
