"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Ticket } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Prize = {
  id: string;
  name: string;
  quantity: number;
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrizes() {
      const { data, error } = await supabase
        .from("prizes")
        .select("id, name, quantity")
        .eq("active", true)
        .gt("quantity", 0)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        setPrizes([]);
      } else {
        setPrizes(data || []);
      }

      setLoading(false);
    }

    loadPrizes();
  }, []);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#faf7f0] pt-28">
        <section className="px-6 py-14">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div>
                <p className="font-bold uppercase tracking-[0.2em] text-[#C9A44D]">
                  Current prizes
                </p>
                <h1 className="mt-4 text-5xl md:text-6xl font-black text-[#142A52]">
                  Spin for prizes that support chinuch
                </h1>
                <p className="mt-5 max-w-2xl text-lg text-gray-600">
                  These are the active prizes currently stocked on the wheel. Every paid spin helps Chinuch Yehudi USA continue its work.
                </p>
              </div>

              <Link href="/buy-spins" className="btn-main inline-flex items-center justify-center gap-3">
                <Ticket className="h-5 w-5" />
                Buy Spins
              </Link>
            </div>

            {loading ? (
              <div className="mt-14 rounded-2xl bg-white p-8 text-center shadow-lg">
                Loading prizes...
              </div>
            ) : prizes.length === 0 ? (
              <div className="mt-14 rounded-2xl bg-white p-8 text-center shadow-lg">
                Prizes are being restocked. Please check back soon.
              </div>
            ) : (
              <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {prizes.map((prize) => (
                  <article key={prize.id} className="rounded-2xl border border-[#C9A44D]/25 bg-white p-7 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#142A52] text-white">
                      <Gift className="h-6 w-6" />
                    </div>

                    <h2 className="mt-5 text-2xl font-black text-[#142A52]">
                      {prize.name}
                    </h2>

                    <p className="mt-4 text-gray-600">
                      Remaining: <span className="font-bold text-[#142A52]">{prize.quantity}</span>
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
