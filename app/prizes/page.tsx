"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Ticket } from "lucide-react";
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
      <main className="min-h-screen cy-page">
        <section className="px-6 py-14">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div>
                <p className="font-bold uppercase tracking-[0.2em] text-[#0f8db3]">
                  Current prizes
                </p>
                <h1 className="mt-4 text-5xl md:text-6xl font-black text-[#12304a]">
                  Spin for prizes that support chinuch
                </h1>
                <p className="mt-5 max-w-2xl text-lg text-slate-600">
                  These are the active prizes currently stocked on the wheel. Every paid spin helps Chinuch Yehudi USA continue its work.
                </p>
              </div>

              <Link href="/buy-spins" className="btn-main inline-flex items-center justify-center gap-3">
                <Ticket className="h-5 w-5" />
                Buy Spins
              </Link>
            </div>

            {loading ? (
              <div className="mt-14 cy-card rounded-2xl p-8 text-center">
                Loading prizes...
              </div>
            ) : prizes.length === 0 ? (
              <div className="mt-14 cy-card rounded-2xl p-8 text-center">
                Prizes are being restocked. Please check back soon.
              </div>
            ) : (
              <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {prizes.map((prize) => (
                  <article key={prize.id} className="rounded-2xl border border-[#0f8db3]/15 bg-white/85 p-7 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#12304a] text-white">
                      <Gift className="h-6 w-6" />
                    </div>

                    <h2 className="mt-5 text-2xl font-black text-[#12304a]">
                      {prize.name}
                    </h2>

                    <p className="mt-4 text-slate-600">
                      Remaining: <span className="font-bold text-[#12304a]">{prize.quantity}</span>
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
