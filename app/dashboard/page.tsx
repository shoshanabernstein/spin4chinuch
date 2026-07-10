"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";

import StatCard from "@/components/ui/StatCard";
import ActionCard from "@/components/ui/ActionCard";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";

import Image from "next/image";

import {
  DollarSign,
  Ticket,
  CircleDashed,
  Trophy,
  Shield,
} from "lucide-react";

type Win = {
  id: string;
  prize: string;
  created_at: string;
};

export default function DashboardPage() {
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [spinsPurchased, setSpinsPurchased] = useState(0);
  const [donations, setDonations] = useState(0);
  const [wins, setWins] = useState<Win[]>([]);
  const [role, setRole] = useState("");

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const profileReq = supabase
      .from("profiles")
      .select("remaining_spins,total_spins,role")
      .eq("id", user.id)
      .single();

    const winsReq = supabase
      .from("wins")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const paymentLogsReq = supabase
      .from("payment_logs")
      .select("amount")
      .eq("user_id", user.id);

    const [
      { data: profile },
      { data: winsData },
      { data: paymentLogsData },
    ] = await Promise.all([
      profileReq,
      winsReq,
      paymentLogsReq,
    ]);

    if (profile) {
      setSpinsLeft(profile.remaining_spins ?? 0);
      setSpinsPurchased(profile.total_spins ?? 0);
      setRole(profile.role ?? "");
    }

    if (winsData) {
      setWins(winsData);
    }

    const totalDonations = (paymentLogsData ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0
    );

    setDonations(totalDonations / 100);
  }

  useEffect(() => {
    loadUser();

    const onFocus = () => loadUser();

    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">

        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
        </div>

        {/* ✅ UNIFIED SPACING SYSTEM */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 space-y-8">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-white p-5 sm:p-6 lg:p-8 shadow-lg">
           

<Image
  src="/wheel-watermark.png"
  alt=""
  aria-hidden
  width={1200}
  height={1200}
  className="
    pointer-events-none
    absolute
    right-[-180px]
    top-1/2
    w-[700px]
    -translate-y-1/2
    opacity-15
    select-none
  "
/>

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4267A8]">
                  Welcome Back
                </p>

                <h1 className="mt-1 text-3xl sm:text-4xl font-black text-[#142A52]">
                  Dashboard
                </h1>

                <p className="mt-2 max-w-xl text-sm sm:text-base text-slate-500">
                  Thanks for supporting Chinuch Yehudi!
                </p>
              </div>

              <Button href="/spin" variant="primary">
                Spin Now
              </Button>

            </div>
          </section>

          {/* Stats */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard label="Total Donations" value={`$${donations}`} icon={<DollarSign />} />
            <StatCard label="Spins Purchased" value={spinsPurchased} icon={<Ticket />} />
            <StatCard label="Spins Left" value={spinsLeft} icon={<CircleDashed />} />
            <StatCard label="Wins" value={wins.length} icon={<Trophy />} />

          </div>

          {/* Primary Actions */}
          <div className="grid gap-5 lg:grid-cols-2">

            <ActionCard
              title="Buy Spins"
              description="Purchase spins and increase your chances of winning amazing prizes."
              buttonText="Buy Spins"
              href="/buy-spins"
              icon={<Ticket size={28} />}
            />

            <ActionCard
              title="Spin Now"
              description="Use your available spins for a chance to win incredible prizes."
              buttonText="Spin Now"
              href="/spin"
              icon={<CircleDashed size={28} />}
            />

          </div>

          {/* WIN HISTORY (FULL WIDTH) */}
          <div className="mt-8">
            <Panel
              title="Win History"
              subtitle="Your latest prizes"
            >
              {wins.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
                  <div className="text-5xl">🎁</div>

                  <h3 className="mt-5 text-2xl font-bold text-[#142A52]">
                    No wins yet
                  </h3>

                  <p className="mt-2 text-slate-500">
                    Purchase some spins and try your luck!
                  </p>

                  <div className="mt-8">
                    <Button href="/buy-spins" variant="primary">
                      Buy Spins
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 w-full">

                  <div className="grid grid-cols-[1fr_auto_auto] border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    <div>Prize</div>
                    <div>Date</div>
                    <div>Status</div>
                  </div>

                  {wins.map((win) => (
                    <div
                      key={win.id}
                      className="grid grid-cols-[1fr_auto_auto] items-center border-b border-slate-100 px-4 sm:px-6 py-5 hover:bg-slate-50 last:border-b-0"
                    >
                      <div className="font-semibold text-[#142A52]">
                        {win.prize}
                      </div>

                      <div className="text-sm text-slate-500 mr-6">
                        {new Date(win.created_at).toLocaleDateString()}
                      </div>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                        Won
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* ADMIN */}
          {role === "admin" && (
            <Panel
              title="👑 Admin Tools"
              subtitle="Administrative actions"
            >
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

                <ActionCard title="Users" description="Manage registered users" buttonText="Manage Users" href="/admin/users" icon={<Shield size={24} />} />

                <ActionCard title="Prizes" description="Manage available prizes" buttonText="Manage Prizes" href="/admin/prizes" icon={<Trophy size={24} />} />

                <ActionCard title="Winners" description="View winning history" buttonText="View Winners" href="/admin/winners" icon={<Ticket size={24} />} />

                <ActionCard title="Dashboard" description="Open admin dashboard" buttonText="Admin Dashboard" href="/admin" icon={<DollarSign size={24} />} />

              </div>
            </Panel>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
