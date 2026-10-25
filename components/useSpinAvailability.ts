"use client";

import { useCallback, useEffect, useState } from "react";

export function useSpinAvailability() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const check = useCallback(async () => {
    try {
      const response = await fetch("/api/spin-availability", { cache: "no-store" });
      if (!response.ok) throw new Error("Availability unavailable");
      const data = await response.json();
      if (!Number.isSafeInteger(data.remaining) || data.remaining < 0) throw new Error("Invalid availability");
      setRemaining(data.remaining);
      setUnavailable(false);
      return data.remaining as number;
    } catch {
      setRemaining(null);
      setUnavailable(true);
      return null;
    }
  }, []);
  useEffect(() => {
    const refresh = () => { void check(); };
    const initialCheck = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(initialCheck);
      window.removeEventListener("focus", refresh);
    };
  }, [check]);
  return { remaining, unavailable, check };
}
