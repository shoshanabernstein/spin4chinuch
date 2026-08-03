"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Gift,
  MapPin,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Winner = {
  id: number;
  prize: string;
  created_at: string;
  city: string;
  initials: string;
};

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [totalWinners, setTotalWinners] = useState(0);

  useEffect(() => {
    async function loadWinners() {
      const [winnerResult, countResult] = await Promise.all([
        supabase
          .from("public_winners")
          .select("id,created_at,prize,city,initials")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("public_winners")
          .select("id", { count: "exact", head: true }),
      ]);

      if (winnerResult.error) {
        console.error("Error loading winners:", winnerResult.error);
        setErrorMessage("Winners are temporarily unavailable. Please try again shortly.");
        setLoading(false);
        return;
      }

      const formatted = (winnerResult.data ?? []).map((winner) => ({
        id: winner.id,
        prize: winner.prize ?? "Prize",
        created_at: winner.created_at,
        city: winner.city || "Location private",
        initials: winner.initials || "Winner",
      }));

      setWinners(formatted);
      setTotalWinners(countResult.count ?? formatted.length);
      setLoading(false);
    }

    void loadWinners();
  }, []);

  const recentCities = useMemo(
    () => new Set(winners.map((winner) => winner.city).filter((city) => city !== "Location private")).size,
    [winners]
  );
  const recentPrizes = useMemo(
    () => new Set(winners.map((winner) => winner.prize)).size,
    [winners]
  );
  const latestWinner = winners[0];

  return (
    <main className="app-page">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[#071628]" />
      <div className="pointer-events-none absolute left-[-10rem] top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-[#2F6ED8]/25 blur-[110px]" />
      <div className="pointer-events-none absolute right-[-8rem] top-28 h-[26rem] w-[26rem] rounded-full bg-[#C9A44D]/15 blur-[100px]" />

      <div className="app-container max-w-7xl">
        <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#0C1F38]/90 p-7 text-white shadow-[0_28px_90px_rgba(0,0,0,.3)] sm:p-10 lg:p-12">
          <div className="absolute right-[-7rem] top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border-[55px] border-[#C9A44D]/[0.06]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A44D]/20 bg-[#C9A44D]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#E8CD7A]">
                <Sparkles className="h-4 w-4" /> Real wins, real community
              </div>
              <h1 className="mt-6 text-5xl font-black tracking-[-0.05em] sm:text-6xl">Meet our winners.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#BFD2EB]">
                Every name here represents a verified Spin4Chinuch win—and every spin helps support meaningful Jewish education.
              </p>
              <Link href="/buy-spins" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#C9A44D] to-[#F0D47F] px-7 py-4 font-black text-[#142A52] shadow-lg transition hover:-translate-y-0.5">
                Get your spins <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {latestWinner ? (
              <article className="relative rounded-[28px] border border-white/10 bg-white/[0.07] p-6 backdrop-blur sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8DB9F4]">Latest verified win</p>
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2F6ED8] to-[#173B73] text-xl font-black text-white shadow-lg">{latestWinner.initials}</div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black text-white">{latestWinner.prize}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[#9DB2CE]"><MapPin className="h-4 w-4" /> {latestWinner.city}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-[#9DB2CE]">
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {new Date(latestWinner.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-2 font-bold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Verified</span>
                </div>
              </article>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.04] p-8 text-center text-[#9DB2CE]">The first winner spotlight will appear here.</div>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Verified winners", value: totalWinners, note: "Complete winner count", icon: Trophy },
            { label: "Communities", value: recentCities, note: "Among recent winners", icon: UsersRound },
            { label: "Prize variety", value: recentPrizes, note: "Among recent wins", icon: Gift },
          ].map(({ label, value, note, icon: Icon }) => (
            <article key={label} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_16px_45px_rgba(20,42,82,.09)]">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="mt-2 text-4xl font-black text-[#142A52]">{loading ? "—" : value}</p><p className="mt-2 text-sm text-slate-500">{note}</p></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#4267A8]"><Icon className="h-6 w-6" /></div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[32px] border border-blue-100 bg-white p-6 shadow-[0_18px_55px_rgba(20,42,82,.1)] sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="page-eyebrow">Winner wall</p><h2 className="mt-2 text-3xl font-black text-[#142A52] sm:text-4xl">Recent celebrations</h2></div>
            <p className="text-sm text-slate-500">Updated automatically after verified wins</p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading verified winners…</div>
          ) : errorMessage ? (
            <div role="alert" className="py-20 text-center text-red-600">{errorMessage}</div>
          ) : winners.length === 0 ? (
            <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-500">The first winners will appear here.</div>
          ) : (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {winners.map((winner) => (
                <article key={winner.id} className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#142A52] font-black text-white">{winner.initials}</div>
                    <div className="min-w-0"><p className="font-black leading-snug text-[#142A52]">{winner.prize}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {winner.city}</p></div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
                    <span>{new Date(winner.created_at).toLocaleDateString()}</span>
                    <span className="font-bold uppercase tracking-wide text-emerald-600">Verified win</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
