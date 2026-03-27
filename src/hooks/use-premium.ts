"use client";

import { useState, useEffect, useCallback } from "react";
import type { PlanInfo } from "@/lib/services/premium";

const DEFAULT: PlanInfo = {
  plan: "free",
  isPremium: false,
  isTrial: false,
  trialUsed: false,
  expiresAt: null,
  daysRemaining: null,
};

export function usePremium() {
  const [plan, setPlan] = useState<PlanInfo>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/premium");
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...plan, loading, refresh };
}
