"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User, Mail, Building2, CheckCircle, Clock, Settings,
  RefreshCw, LogOut, Loader2,
} from "lucide-react";
import Link from "next/link";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  authProvider: string | null;
  onboarding: { bankConnected: boolean; transactionsSynced: boolean; subscriptionsDetected: boolean; actionsGenerated: boolean; wowSeen: boolean; completed: boolean };
  connectedProviders: { provider: string; status: string; accountCount: number }[];
  lastSyncAt: string | null;
  stats: { totalActions: number; completedActions: number; totalTasks: number; completedTasks: number; activeSubscriptions: number; widgetsCount: number };
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const tNav = useTranslations("nav");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>;
  }

  if (!profile) {
    return <div className="text-center py-20 text-muted-foreground">Unable to load profile</div>;
  }

  const s = profile.stats;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {/* Account Info */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            {profile.image ? (
              <img src={profile.image} alt="" className="w-14 h-14 rounded-full" />
            ) : (
              <User size={24} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">{profile.name || "User"}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail size={14} /> {profile.email}
            </p>
            {profile.authProvider && (
              <Badge variant="outline" className="mt-1">{profile.authProvider}</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Connected Providers */}
      <Card>
        <CardHeader><CardTitle>{t("bankConnections")}</CardTitle></CardHeader>
        <div className="px-6 pb-6">
          {profile.connectedProviders.length > 0 ? (
            <div className="space-y-3">
              {profile.connectedProviders.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 size={18} />
                    <div>
                      <p className="text-sm font-medium capitalize">{p.provider}</p>
                      <p className="text-xs text-muted-foreground">{p.accountCount} {t("accounts")}{p.accountCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <Badge variant={p.status === "connected" ? "success" : "warning"}>
                    {p.status}
                  </Badge>
                </div>
              ))}
              {profile.lastSyncAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} /> {t("lastSync", { date: new Date(profile.lastSyncAt).toLocaleString("en-GB") })}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">{t("noBankYet")}</p>
              <Link href="/onboarding"><Button variant="accent" size="sm">{t("connectBank")}</Button></Link>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader><CardTitle>{t("activity")}</CardTitle></CardHeader>
        <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: t("actionsCompleted"), value: `${s.completedActions}/${s.totalActions}` },
            { label: t("tasksCompleted"), value: `${s.completedTasks}/${s.totalTasks}` },
            { label: t("activeSubs"), value: String(s.activeSubscriptions) },
            { label: t("activeWidgets"), value: String(s.widgetsCount) },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Onboarding Status */}
      <Card>
        <CardHeader><CardTitle>{t("onboarding")}</CardTitle></CardHeader>
        <div className="px-6 pb-6 space-y-2">
          {[
            { label: t("stepBankConnected"), done: profile.onboarding.bankConnected },
            { label: t("stepTransactions"), done: profile.onboarding.transactionsSynced },
            { label: t("stepSubscriptions"), done: profile.onboarding.subscriptionsDetected },
            { label: t("stepActions"), done: profile.onboarding.actionsGenerated },
            { label: t("stepWow"), done: profile.onboarding.wowSeen },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} className={step.done ? "text-success" : "text-muted-foreground/30"} />
              <span className={step.done ? "" : "text-muted-foreground"}>{step.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/settings" className="flex-1">
          <Button variant="outline" className="w-full"><Settings size={16} className="mr-2" />{tNav("settings")}</Button>
        </Link>
        <Link href="/onboarding" className="flex-1">
          <Button variant="outline" className="w-full"><RefreshCw size={16} className="mr-2" />{t("reconnect")}</Button>
        </Link>
        <Button variant="ghost" className="flex-1" onClick={() => window.location.href = "/api/auth/signout"}>
          <LogOut size={16} className="mr-2" />{t("signOut")}
        </Button>
      </div>
    </div>
  );
}
