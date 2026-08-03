"use client";

import { useEffect, useState } from "react";
import { CircleDashed, Gift, Shield, Ticket, Trophy, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ActionCard from "@/components/ui/ActionCard";
import StatCard from "@/components/ui/StatCard";

type AdminStats = {
  users: number;
  prizes: number;
  activePrizes: number;
  winners: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({ users: 0, prizes: 0, activePrizes: 0, winners: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [users, prizes, activePrizes, winners] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("prizes").select("id", { count: "exact", head: true }),
        supabase.from("prizes").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("wins").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: users.count ?? 0,
        prizes: prizes.count ?? 0,
        activePrizes: activePrizes.count ?? 0,
        winners: winners.count ?? 0,
      });
      setLoading(false);
    }
    void loadStats();
  }, []);

  return (
    <main className="app-page">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
      </div>
      <div className="app-container">
        <section className="page-hero">
          <div className="absolute right-0 top-0 h-full w-72 bg-[url('/wheel-watermark.png')] bg-contain bg-right bg-no-repeat opacity-[0.06]" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4267A8]">Administration</p>
            <h1 className="mt-1 text-4xl font-black text-[#142A52]">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-slate-500">Manage users, prizes, wheel outcomes, and winners from one place.</p>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-busy={loading}>
          <StatCard label="Registered Users" value={loading ? "—" : stats.users} icon={<Users />} />
          <StatCard label="Total Prizes" value={loading ? "—" : stats.prizes} icon={<Gift />} />
          <StatCard label="Active Prizes" value={loading ? "—" : stats.activePrizes} icon={<Trophy />} />
          <StatCard label="Recorded Wins" value={loading ? "—" : stats.winners} icon={<Ticket />} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ActionCard title="Users" description="Manage roles, spin balances, and account access." buttonText="Manage Users" href="/admin/users" icon={<Shield size={28} />} />
          <ActionCard title="Prizes" description="Create, edit, archive, and restore fundraiser prizes." buttonText="Manage Prizes" href="/admin/prizes" icon={<Gift size={28} />} />
          <ActionCard title="Wheel Outcomes" description="Control wheel labels, prize links, weights, and availability." buttonText="Manage Outcomes" href="/admin/outcomes" icon={<CircleDashed size={28} />} />
          <ActionCard title="Winners" description="Review winner history and fulfillment information." buttonText="View Winners" href="/admin/winners" icon={<Trophy size={28} />} />
        </section>
      </div>
    </main>
  );
}
