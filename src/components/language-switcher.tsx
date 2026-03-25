"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const localeLabels: Record<string, string> = {
  ru: "RU",
  en: "EN",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const switchLocale = async (newLocale: string) => {
    if (newLocale === locale) return;

    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    });

    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      {Object.entries(localeLabels).map(([key, label]) => (
        <button
          key={key}
          onClick={() => switchLocale(key)}
          className={`px-2 py-1 rounded transition-colors ${
            locale === key
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
