"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockNotifications, type MockNotification } from "@/lib/services/mock-data";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const typeIcon: Record<string, typeof Bell> = {
  savings_detected: PiggyBank,
  action_requires_manual_step: AlertTriangle,
  action_completed: CheckCircle,
  action_generated: Bell,
  action_confirmed: CheckCircle,
  reminder_due: Bell,
};

const typeRoute: Record<string, string> = {
  savings_detected: "/wow",
  action_requires_manual_step: "/tasks",
  action_completed: "/actions",
  action_generated: "/actions",
  action_confirmed: "/actions",
  reminder_due: "/tasks",
};

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<MockNotification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;
  const unread = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (notif: MockNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    const route = typeRoute[notif.type];
    if (route) router.push(route);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">
            {unread > 0 ? t("unread", { count: unread }) : t("allCaughtUp")}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck size={16} className="mr-2" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          {t("filterAll")}
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          {t("filterUnread")}{unread > 0 ? ` (${unread})` : ""}
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map((notif) => {
          const Icon = typeIcon[notif.type] || Bell;
          return (
            <Card
              key={notif.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-muted/30 ${
                notif.read ? "opacity-60" : "border-accent/30"
              }`}
              onClick={() => handleClick(notif)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                    notif.read ? "bg-muted" : "bg-accent/10"
                  }`}
                >
                  <Icon
                    size={16}
                    className={notif.read ? "text-muted-foreground" : "text-accent"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {notif.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Bell size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === "unread" ? t("noUnread") : t("noNotifications")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
