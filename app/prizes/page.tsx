"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import PrizeCard from "@/components/buy-spins/PrizeCard";
import { supabase } from "@/lib/supabase";

type Prize = {
  id: string;
  name: string;
  image_url: string | null;
  retail_value: number | null;
  quantity: number;
  sponsor_name: string | null;
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPrizes() {
      const { data, error } = await supabase
        .from("prizes")
        .select("*")
        .eq("active", true)
        .gt("quantity", 0)
        .order("retail_value", { ascending: false, nullsFirst: false });

      if (error) setError("Prizes are temporarily unavailable. Please try again shortly.");
      else setPrizes(data || []);
      setLoading(false);
    }

    fetchPrizes();
  }, []);

  return (
    <div className="app-page">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
      </div>

      <div className="app-container">
        {/* Hero */}
        <section className="page-hero">



          {/* Wheel Watermark */}
          <div
            className="absolute right-[-80px] top-0 h-full w-[50%] bg-contain bg-right bg-no-repeat opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: "url('/wheel-watermark.png')",
            }}
          />

          {/* Background Glows */}
          <div className="absolute -left-28 -top-28 h-64 w-64 rounded-full bg-blue-200/25 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-yellow-200/20 blur-3xl" />

          <div className="relative flex items-center justify-between gap-6">

            {/* Title */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none text-[#142A52]">
                All <span className="text-[#C9A44D]">Prizes</span>
              </h1>
            </div>

            {/* Gift */}
            <div
              className="
        relative
        flex
        h-20
        w-20
        items-center
        justify-center
        rounded-2xl
        bg-gradient-to-br
        from-[#142A52]
        to-[#23457F]
        shadow-lg
      "
            >

              <div className="absolute inset-0 rounded-2xl bg-[#C9A44D]/20 blur-xl" />

              <div className="relative rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <Gift
                  className="h-8 w-8 text-[#E7C45B]"
                  strokeWidth={2}
                />
              </div>

            </div>

          </div>

        </section>

        {/* Prize Grid */}
        <section>
          {loading ? (
            <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center text-slate-500 shadow-lg">Loading prizes…</div>
          ) : error ? (
            <div role="alert" className="rounded-3xl border border-red-100 bg-white py-16 text-center text-red-600 shadow-lg">{error}</div>
          ) : prizes.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center text-slate-500">New prizes will be announced soon.</div>
          ) : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prizes.map((prize) => (
              <PrizeCard
                key={prize.id}
                name={prize.name}
                imageUrl={prize.image_url}
                quantity={prize.quantity}
                sponsorName={prize.sponsor_name}
              />
            ))}
          </div>}
        </section>
      </div>
    </div>
  );
}
