"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Check } from "lucide-react";

interface Settings {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  showAiSummary: boolean;
  summaryStyle: string;
  enableLlm: boolean;
  autoCreateWidgets: boolean;
  defaultWidgetColor: string;
  popupReminders: boolean;
  overdueHighlight: boolean;
  dueSoonReminders: boolean;
  overdueReminders: boolean;
  staleActionReminders: boolean;
  defaultSnoozeMins: number;
}

const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const update = (key: keyof Settings, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("subtitle")}
          </p>
        </div>
        <Button variant="accent" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : saved ? <Check size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
          {saved ? tc("saved") : tc("save")}
        </Button>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications")}</CardTitle>
          <CardDescription>{t("notificationsDesc")}</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <Toggle label={t("inApp")} value={settings.inAppEnabled} onChange={(v) => update("inAppEnabled", v)} />
          <Toggle label={t("email")} value={settings.emailEnabled} onChange={(v) => update("emailEnabled", v)} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("sms")}</p>
              <p className="text-xs text-muted-foreground">{t("smsSoon")}</p>
            </div>
            <Badge variant="outline">{t("smsSoon")}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("quietStart")}</label>
              <input type="time" className="h-9 w-full px-3 rounded-md border border-border bg-background text-sm" value={settings.quietHoursStart || ""} onChange={(e) => update("quietHoursStart", e.target.value || null)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("quietEnd")}</label>
              <input type="time" className="h-9 w-full px-3 rounded-md border border-border bg-background text-sm" value={settings.quietHoursEnd || ""} onChange={(e) => update("quietHoursEnd", e.target.value || null)} />
            </div>
          </div>
        </div>
      </Card>

      {/* Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboardSection")}</CardTitle>
          <CardDescription>{t("dashboardDesc")}</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <Toggle label={t("showSummary")} value={settings.showAiSummary} onChange={(v) => update("showAiSummary", v)} />
          <div>
            <p className="text-sm font-medium mb-2">{t("summaryStyle")}</p>
            <div className="flex gap-2">
              {["concise", "detailed"].map((style) => (
                <Button key={style} variant={settings.summaryStyle === style ? "default" : "outline"} size="sm" onClick={() => update("summaryStyle", style)}>
                  {t(style as "concise" | "detailed")}
                </Button>
              ))}
            </div>
          </div>
          <Toggle label={t("enableLlm")} value={settings.enableLlm} onChange={(v) => update("enableLlm", v)} />
        </div>
      </Card>

      {/* Widgets */}
      <Card>
        <CardHeader>
          <CardTitle>{t("widgetsSection")}</CardTitle>
          <CardDescription>{t("widgetsDesc")}</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <Toggle label={t("autoCreate")} value={settings.autoCreateWidgets} onChange={(v) => update("autoCreateWidgets", v)} />
          <Toggle label={t("popupReminders")} value={settings.popupReminders} onChange={(v) => update("popupReminders", v)} />
          <Toggle label={t("overdueHighlight")} value={settings.overdueHighlight} onChange={(v) => update("overdueHighlight", v)} />
          <div>
            <p className="text-sm font-medium mb-2">{t("defaultColor")}</p>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => update("defaultWidgetColor", c)} className={`w-7 h-7 rounded-full border-2 ${settings.defaultWidgetColor === c ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>{t("remindersSection")}</CardTitle>
          <CardDescription>{t("remindersDesc")}</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <Toggle label={t("dueSoon")} value={settings.dueSoonReminders} onChange={(v) => update("dueSoonReminders", v)} />
          <Toggle label={t("overdueReminders")} value={settings.overdueReminders} onChange={(v) => update("overdueReminders", v)} />
          <Toggle label={t("staleActions")} value={settings.staleActionReminders} onChange={(v) => update("staleActionReminders", v)} />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("defaultSnooze")}</label>
            <select className="h-9 px-3 rounded-md border border-border bg-background text-sm" value={settings.defaultSnoozeMins} onChange={(e) => update("defaultSnoozeMins", parseInt(e.target.value))}>
              <option value={60}>{t("snooze1h")}</option>
              <option value={240}>{t("snooze4h")}</option>
              <option value={1440}>{t("snooze24h")}</option>
              <option value={4320}>{t("snooze3d")}</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-colors ${value ? "bg-accent" : "bg-muted"}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "left-5" : "left-1"}`} />
      </button>
    </div>
  );
}
