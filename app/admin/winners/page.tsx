"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/ui/StatCard";
import GiftCardDeliveries from "@/components/admin/GiftCardDeliveries";

type Win = {
  id: number;
  user_email: string;
  prize: string;
  created_at: string;
  status: string;
  delivery_type: string | null;
  delivery_instructions: string | null;
};

export default function AdminWinnersPage() {
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWins = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("wins").select("id,user_email,prize,created_at,status,delivery_type,delivery_instructions").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setWins(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void loadWins(); }, [loadWins]);

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase.from("wins").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Winner status updated.");
    setWins((current) => current.map((win) => win.id === id ? { ...win, status } : win));
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className="page-hero">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4267A8]">Administration</p><h1 className="mt-1 text-4xl font-black">Winners</h1><p className="mt-2 text-slate-500">Track winners and fulfillment status.</p></div>
            <Link href="/admin" className="rounded-full border border-slate-200 px-5 py-3 text-center font-bold shadow-sm">Back to Admin</Link>
          </div>
        </section>
        <section className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Total Winners" value={wins.length} icon={<Trophy />} />
          <StatCard label="Pending" value={wins.filter((win) => win.status === "Pending").length} icon={<Clock3 />} />
          <StatCard label="Fulfilled" value={wins.filter((win) => win.status === "Fulfilled").length} icon={<CheckCircle2 />} />
        </section>
        <GiftCardDeliveries onUpdate={loadWins} />
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
          {loading ? <div className="py-16 text-center text-slate-500">Loading winners…</div> : wins.length === 0 ? <div className="py-16 text-center text-slate-500">No winners have been recorded.</div> : wins.map((win) => (
            <article key={win.id} className="grid gap-5 border-b border-slate-100 p-5 last:border-0 lg:grid-cols-[1.4fr_1fr_190px] lg:items-center">
              <div><h2 className="text-lg font-bold">{win.prize}</h2><p className="text-sm text-slate-500">{win.user_email}</p><p className="mt-1 text-xs text-slate-400">Won {new Date(win.created_at).toLocaleString()}</p></div>
              <div className="text-sm text-slate-500"><p>{win.delivery_type || "No delivery type"}</p>{win.delivery_instructions && <p className="mt-1 text-xs">{win.delivery_instructions}</p>}</div>
              <div><label htmlFor={`status-${win.id}`} className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Status</label><select id={`status-${win.id}`} value={win.status} onChange={(event) => void updateStatus(win.id, event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2"><option>Pending</option><option>Fulfilled</option><option>Cancelled</option></select></div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
