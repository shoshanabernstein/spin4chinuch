"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import Navbar from "@/components/Navbar";
import PrizeCard from "@/components/buy-spins/PrizeCard";
import { supabase } from "@/lib/supabase";

type Prize = {
  id: string;
  name: string;
  image_url: string;
  retail_value: number | null;
  sponsor_name: string | null;
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);

  useEffect(() => {
    async function fetchPrizes() {
      const { data, error } = await supabase
        .from("prizes")
        .select("*")
        .eq("active", true)
        .order("id", { ascending: true });

      if (!error) {
        setPrizes(data || []);
      }
    }

    fetchPrizes();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 space-y-12">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-xl">

          {/* Wheel Watermark */}
          <div
            className="absolute right-[-80px] top-0 h-full w-[50%] bg-contain bg-right bg-no-repeat opacity-[0.025]"
            style={{
              backgroundImage: "url('/wheel-watermark.svg')",
            }}
          />

          {/* Background Glows */}
          <div className="absolute -left-28 -top-28 h-64 w-64 rounded-full bg-blue-200/25 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-yellow-200/20 blur-3xl" />

          <div className="relative flex items-center justify-between gap-6 px-8 py-6 lg:px-10">

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prizes.map((prize) => (
              <PrizeCard
                key={prize.id}
                name={prize.name}
                imageUrl={prize.image_url}
                retailValue={prize.retail_value}
                sponsorName={prize.sponsor_name}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}