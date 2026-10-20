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
  Gift,
  ArrowRight,
  Ticket,
  CircleDashed,
  Trophy,
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
      <div className="app-page">

        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
        </div>

        {/* ✅ UNIFIED SPACING SYSTEM */}
        <div className="app-container">
          {/* Hero */}
          <section className="page-hero">
           

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
            >
              {wins.length === 0 ? (
                <div className="relative overflow-hidden rounded-[24px] border border-[#DFE7F1] bg-gradient-to-b from-[#F6F8FC] to-white px-6 py-12 text-center sm:py-14">
                  <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-48 w-72 -translate-x-1/2 rounded-full bg-[#E7EEF9]/60 blur-3xl" />
                  <div className="relative mx-auto max-w-sm">
                    <div aria-hidden="true" className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#E6D6A9] bg-gradient-to-br from-[#FFFCF3] to-[#F4E8C5] shadow-[0_6px_18px_rgba(146,113,41,.08)]">
                      <Gift strokeWidth={1.4} className="h-9 w-9 text-[#9C7A30]" />
                      <span className="absolute -bottom-2 left-1/2 h-px w-10 -translate-x-1/2 bg-[#D8B65C]/40" />
                    </div>
                    <h3 className="mt-7 text-2xl font-bold tracking-[-0.025em] text-[#142A52]">
                      No wins yet
                    </h3>
                    <div className="mt-7">
                      <Button href="/buy-spins" variant="primary">
                        Buy Spins <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
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
            <ActionCard
              title="Admin Dashboard"
              description="Manage users, prizes, wheel outcomes, and winners."
              buttonText="Open Admin Dashboard"
              href="/admin"
              icon={<DollarSign size={28} />}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
