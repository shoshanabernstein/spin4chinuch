"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Winner = {
  id: number;
  prize: string;
  city: string;
  initials: string;
};

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadWinners() {
      const winnerResult = await supabase
        .from("public_winners")
        .select("id,prize,city,initials")
        .order("created_at", { ascending: false })
        .limit(50);

      if (winnerResult.error) {
        console.error("Error loading winners:", winnerResult.error);
        setErrorMessage("Winners are temporarily unavailable. Please try again shortly.");
        setLoading(false);
        return;
      }

      const formatted = (winnerResult.data ?? []).map((winner) => ({
        id: winner.id,
        prize: winner.prize ?? "Prize",
        city: winner.city || "Location private",
        initials: winner.initials || "Winner",
      }));

      setWinners(formatted);
      setLoading(false);
    }

    void loadWinners();
  }, []);

  const latestWinner = winners[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F6FB] pb-20 pt-5 sm:pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[430px] bg-[#071628]" />
      <div className="pointer-events-none absolute left-[-12rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#2F6ED8]/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10rem] top-10 h-[30rem] w-[30rem] rounded-full bg-[#C9A44D]/15 blur-[110px]" />

      <div className="relative mx-auto site-width px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#142E50] via-[#0D2039] to-[#09182C] px-6 py-8 text-white shadow-[0_20px_60px_rgba(2,12,27,.22)] sm:px-9 sm:py-10 lg:px-12 lg:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-48 h-[34rem] w-[34rem] rounded-full border-[54px] border-white/[0.025]" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-[-9rem] left-[25%] h-64 w-64 rounded-full bg-[#2F6ED8]/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="absolute left-[44%] top-9 h-2 w-2 rotate-12 rounded-sm bg-[#E8C761]/50" />
            <span className="absolute bottom-9 left-[38%] h-1.5 w-5 -rotate-[30deg] rounded-full bg-[#80A8F7]/40" />
            <span className="absolute right-7 top-7 h-1.5 w-1.5 rounded-full bg-[#E8C761]/60" />
          </div>

          <div className="relative grid gap-9 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-10">
            <div>
              <h1 className="max-w-xl text-4xl font-black leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-[clamp(2.5rem,4vw,3.5rem)]">Meet our <span className="text-[#F0D47F]">winners.</span></h1>
              <Link href="/buy-spins" className="group mt-7 inline-flex items-center gap-4 rounded-full bg-gradient-to-r from-[#DEBD5B] to-[#F5DC8D] px-6 py-3.5 font-black text-[#102743] shadow-[0_8px_24px_rgba(216,179,79,.18)] transition hover:bg-[#F5DC8D] hover:shadow-[0_12px_28px_rgba(216,179,79,.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F0D47F]">
                Get your spins <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
              </Link>

            </div>

            {latestWinner ? (
              <article className="relative overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-br from-[#293D58] to-[#1A2A40] p-5 shadow-[0_14px_40px_rgba(0,0,0,.16)] sm:p-7">
                <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-[#D8B34F]/15 to-transparent" />
                <div className="relative flex items-center justify-between gap-4">
                  <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-[#ABCDFC]"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#E8C761]" />Latest winner</p>
                  <div aria-hidden="true" className="flex h-10 w-10 -rotate-6 items-center justify-center rounded-2xl border border-[#E8C761]/20 bg-[#E8C761]/10 text-[#F0D47F]"><Trophy className="h-5 w-5" /></div>
                </div>
                <div className="relative mt-6 flex items-center gap-4 sm:gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-gradient-to-br from-[#527FE0] to-[#274D97] text-xl font-black text-white shadow-[0_8px_20px_rgba(12,30,65,.25)] sm:h-[72px] sm:w-[72px]">{latestWinner.initials}</div>
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-bold leading-snug tracking-[-0.02em] text-white sm:text-2xl">{latestWinner.prize}</h2>
                    <p className="mt-2.5 flex items-center gap-1.5 text-sm text-[#C0CDE0]"><MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-[#8DB9F4]" /> {latestWinner.city}</p>
                  </div>
                </div>
              </article>
            ) : (
              <div className="rounded-[26px] border border-dashed border-white/15 bg-white/[0.04] p-8 text-center text-[#9DB2CE]">The first winner spotlight will appear here.</div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-[#DCE5F1] bg-white p-5 shadow-[0_18px_50px_rgba(20,42,82,.08)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-3xl font-black tracking-[-0.035em] text-[#142A52] sm:text-4xl">Recent Winners</h2></div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading winners…</div>
          ) : errorMessage ? (
            <div role="alert" className="py-20 text-center text-red-600">{errorMessage}</div>
          ) : winners.length === 0 ? (
            <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-500">The first winners will appear here.</div>
          ) : (
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {winners.map((winner, index) => (
                <article key={winner.id} className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#DEE7F3] bg-gradient-to-br from-white to-[#F1F6FD] p-5 shadow-[0_4px_16px_rgba(20,42,82,.035)] transition-[border-color,box-shadow] duration-300 hover:border-[#B5CAE8] hover:shadow-[0_12px_30px_rgba(20,42,82,.09)] sm:p-6">
                  <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border-[20px] border-[#E8C761]/[0.07]" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-white bg-gradient-to-br from-[#5786DE] to-[#264F98] text-lg font-black text-white shadow-[0_5px_12px_rgba(47,110,216,.18)]">
                      {winner.initials}
                    </div>
                    <div aria-hidden="true" className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7D49C]/60 bg-[#FFF8E5] text-[#AD8425] ${index % 2 === 0 ? "rotate-6" : "-rotate-6"}`}><Trophy className="h-4 w-4" /></div>
                  </div>
                  <h3 className="relative mt-5 flex-1 break-words text-xl font-bold leading-snug tracking-[-0.02em] text-[#142A52]">{winner.prize}</h3>
                  <div className="relative mt-5 flex items-center gap-2 border-t border-[#DDE6F2] pt-3.5 text-sm text-[#5B708C]">
                    <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-[#527BB7]" />
                    <span className="break-words">{winner.city}</span>
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
