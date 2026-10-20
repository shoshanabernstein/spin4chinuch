"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import PrizeCard from "@/components/buy-spins/PrizeCard";

type Prize = {
  id: string;
  name: string;
  image_url: string | null;
  retail_value: number | null;
  quantity: number;
  original_quantity?: number | null;
  sponsor_name: string | null;
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPrizes() {
      try {
        const response = await fetch("/api/prizes", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load prizes");
        const data = await response.json();
        setPrizes(data.prizes);
      } catch {
        setError("Prizes are temporarily unavailable. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    }

    fetchPrizes();
  }, []);

  return (
    <main className="app-page">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
      </div>

      <div className="app-container">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#142E50] via-[#10233D] to-[#09182C] px-6 py-8 text-white shadow-[0_16px_40px_rgba(13,32,59,.12)] sm:rounded-[32px] sm:px-9 sm:py-10 lg:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-40 h-96 w-96 rounded-full border-[45px] border-white/[0.035]" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-[20%] h-36 w-56 rounded-full bg-[#D8B34F]/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-6">
            <h1 className="text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">All <span className="text-[#F0D47F]">Prizes</span></h1>
            <div aria-hidden="true" className="flex h-16 w-16 shrink-0 -rotate-6 items-center justify-center rounded-[20px] border border-[#E8C761]/25 bg-[#E8C761]/10 text-[#F0D47F] sm:h-20 sm:w-20 sm:rounded-3xl">
              <Gift className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
            </div>
          </div>
        </section>

        {/* Prize Grid */}
        <section aria-label="All prizes" aria-busy={loading}>
          {loading ? (
            <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center text-slate-500 shadow-lg">Loading prizes…</div>
          ) : error ? (
            <div role="alert" className="rounded-3xl border border-red-100 bg-white py-16 text-center text-red-600 shadow-lg">{error}</div>
          ) : prizes.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center text-slate-500">New prizes will be announced soon.</div>
          ) : <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {prizes.map((prize) => (
              <PrizeCard
                gallery
                key={prize.id}
                name={prize.name}
                imageUrl={prize.image_url}
                originalQuantity={prize.original_quantity}
                sponsorName={prize.sponsor_name}
              />
            ))}
          </div>}
        </section>
      </div>
    </main>
  );
}
