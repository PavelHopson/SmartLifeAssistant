"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import {
  LayoutDashboard, CreditCard, Zap, CheckSquare,
  Bell, Layers, User, Settings, Heart,
} from "lucide-react";

const navDef = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard, hasBadge: false },
  { href: "/actions", key: "actions", icon: Zap, hasBadge: false },
  { href: "/tasks", key: "tasks", icon: CheckSquare, hasBadge: false },
  { href: "/subscriptions", key: "subscriptions", icon: CreditCard, hasBadge: false },
  { href: "/notifications", key: "alerts", icon: Bell, hasBadge: true },
  { href: "/health", key: "health", icon: Heart, hasBadge: false },
];

const secondaryDef = [
  { href: "/widgets-lab", key: "widgets", icon: Layers, hasBadge: false },
  { href: "/profile", key: "profile", icon: User, hasBadge: false },
  { href: "/settings", key: "settings", icon: Settings, hasBadge: false },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch { /* graceful */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/realtime/stream");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "notification_count_changed" && typeof data.count === "number") {
            setUnreadCount(data.count);
          }
        } catch { /* ignore */ }
      };
      es.onerror = () => { es?.close(); es = null; };
    } catch { /* SSE unavailable */ }
    const interval = setInterval(fetchUnread, 30_000);
    return () => { clearInterval(interval); es?.close(); };
  }, [fetchUnread]);

  useEffect(() => { fetchUnread(); }, [pathname, fetchUnread]);

  const allNav = [...navDef, ...secondaryDef];

  return (
    <div className="min-h-screen flex flex-col pb-14 sm:pb-0">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-lg">
            {tApp("name")}
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <nav className="flex items-center gap-1">
              {allNav.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                const badge = item.hasBadge ? unreadCount : 0;
                return (
                  <Link key={item.href} href={item.href}
                    className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors relative",
                      active ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}>
                    <Icon size={16} />
                    {t(item.key)}
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-2 pl-2 border-l border-border">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-50">
        <div className="flex items-center justify-around h-14">
          {navDef.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            const badge = item.hasBadge ? unreadCount : 0;
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex flex-col items-center gap-0.5 px-3 py-1 text-xs relative",
                  active ? "text-foreground" : "text-muted-foreground"
                )}>
                <Icon size={20} />
                {t(item.key)}
                {badge > 0 && (
                  <span className="absolute top-0 right-1 w-3.5 h-3.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
