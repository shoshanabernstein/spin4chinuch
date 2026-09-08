"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Gift, MapPin, Sparkles, Trophy } from "lucide-react";
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
        supabase.from("public_winners").select("id", { count: "exact", head: true }),
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

  const recentPrizes = useMemo(
    () => new Set(winners.map((winner) => winner.prize)).size,
    [winners]
  );
  const latestWinner = winners[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F6FB] pb-20 pt-5 sm:pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[430px] bg-[#071628]" />
      <div className="pointer-events-none absolute left-[-12rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#2F6ED8]/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10rem] top-10 h-[30rem] w-[30rem] rounded-full bg-[#C9A44D]/15 blur-[110px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#102743] via-[#0C1F38] to-[#08182C] px-6 py-8 text-white shadow-[0_26px_80px_rgba(2,12,27,.36)] sm:px-9 sm:py-10 lg:px-12">
          <div className="absolute -right-32 -top-36 h-[30rem] w-[30rem] rounded-full border-[70px] border-white/[0.035]" />
          <div className="absolute bottom-[-9rem] left-[35%] h-64 w-64 rounded-full bg-[#2F6ED8]/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8C761]/25 bg-[#E8C761]/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#F0D47F]">
                <Sparkles className="h-3.5 w-3.5" /> Real spins. Real prizes.
              </div>
              <h1 className="mt-5 max-w-xl text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.02]">Meet our winners.</h1>
              <Link href="/buy-spins" className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D8B34F] to-[#F3D77E] px-6 py-3.5 font-black text-[#102743] shadow-[0_12px_35px_rgba(216,179,79,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(216,179,79,.3)]">
                Get your spins <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { label: "Winners", value: totalWinners, icon: Trophy },
                  { label: "Prizes", value: recentPrizes, icon: Gift },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 backdrop-blur-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F0D47F]"><Icon className="h-[18px] w-[18px]" /></div>
                    <div><p className="text-xl font-black leading-none">{loading ? "—" : value}</p><p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9DB2CE]">{label}</p></div>
                  </div>
                ))}
              </div>
            </div>

            {latestWinner ? (
              <article className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.075] p-5 shadow-[0_18px_55px_rgba(0,0,0,.18)] backdrop-blur sm:p-7">
                <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-[#D8B34F]/20 to-transparent" />
                <div className="relative flex items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8DB9F4]">Latest winner</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8C761]/15 text-[#F0D47F]"><Trophy className="h-5 w-5" /></div>
                </div>
                <div className="relative mt-6 flex items-center gap-4 sm:gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#3E7BE0] to-[#1C4684] text-xl font-black text-white shadow-[0_12px_30px_rgba(23,59,115,.4)] sm:h-[72px] sm:w-[72px]">{latestWinner.initials}</div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-black leading-tight text-white sm:text-2xl">{latestWinner.prize}</h2>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-[#AABBD1]"><MapPin className="h-4 w-4" /> {latestWinner.city}</p>
                  </div>
                </div>
                <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-[#AABBD1]">
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {new Date(latestWinner.created_at).toLocaleDateString()}</span>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Congratulations!</span>
                </div>
              </article>
            ) : (
              <div className="rounded-[26px] border border-dashed border-white/15 bg-white/[0.04] p-8 text-center text-[#9DB2CE]">The first winner spotlight will appear here.</div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-[#DCE5F1] bg-white p-5 shadow-[0_18px_50px_rgba(20,42,82,.08)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#3A6CB4]">Winner wall</p><h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#142A52] sm:text-4xl">Recent Winners</h2></div>
            <p className="flex items-center gap-2 text-sm text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Updated after every win</p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading winners…</div>
          ) : errorMessage ? (
            <div role="alert" className="py-20 text-center text-red-600">{errorMessage}</div>
          ) : winners.length === 0 ? (
            <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-500">The first winners will appear here.</div>
          ) : (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {winners.map((winner, index) => (
                <article key={winner.id} className="group relative overflow-hidden rounded-[22px] border border-[#E0E7F0] bg-[#F8FAFD] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#BFD0E8] hover:bg-white hover:shadow-[0_16px_35px_rgba(20,42,82,.1)]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2F6ED8] via-[#6EA0EA] to-[#D8B34F] opacity-0 transition group-hover:opacity-100" />
                  <div className="flex items-start gap-4">
                    <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1C3D70] to-[#102743] font-black text-white shadow-sm">
                      {winner.initials}
                      {index === 0 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#D8B34F]" />}
                    </div>
                    <div className="min-w-0 flex-1"><p className="font-black leading-snug text-[#142A52]">{winner.prize}</p><p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5 text-[#5D7EAF]" /> {winner.city}</p></div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#E0E7F0] pt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {new Date(winner.created_at).toLocaleDateString()}</span>
                    <Trophy className="h-4 w-4 text-[#C49E3B] opacity-70" />
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
