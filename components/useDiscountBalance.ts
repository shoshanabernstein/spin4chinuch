"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export function useDiscountBalance() {
  const { user } = useAuth();
  const [balanceCents, setBalance] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadedFor, setLoadedFor] = useState("");
  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); setBalance(0); setEnabled(false); return; }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");
      const response = await fetch("/api/discount-balance", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Number.isSafeInteger(data.balanceCents) || data.balanceCents < 0) throw new Error("Unable to load discount");
      setBalance(data.balanceCents); setEnabled(data.enabled === true); setError(false);
    } catch { setError(true); }
    finally { setLoading(false); setLoadedFor(user.id); }
  }, [user]);
  useEffect(() => {
    const initial = setTimeout(() => { void refresh(); }, 0);
    const focus = () => { void refresh(); };
    window.addEventListener("focus", focus);
    return () => { clearTimeout(initial); window.removeEventListener("focus", focus); };
  }, [refresh]);
  const current = !user || loadedFor === user.id;
  return { balanceCents: current ? balanceCents : 0, enabled: current && enabled, loading: loading || !current, error, refresh };
}
