"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Win = {
  id: string;
  prize: string;
  user_email: string | null;
  created_at: string;
};

function maskEmail(email: string | null) {
  if (!email || !email.includes("@")) return "Supporter";

  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

export default function WinnersPage() {
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWins() {
      const { data, error } = await supabase
        .from("wins")
        .select("id, prize, user_email, created_at")
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) {
        console.error(error);
        setWins([]);
      } else {
        setWins(data || []);
      }

      setLoading(false);
    }

    loadWins();
  }, []);

  return (
    <>
      <Navbar />

      <main className="min-h-screen cy-dark-page text-white">
        <section className="px-6 py-14">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div>
                <p className="font-bold uppercase tracking-[0.2em] text-[#8fe5ef]">
                  Recent winners
                </p>
                <h1 className="mt-4 text-5xl md:text-6xl font-black">
                  Mazel tov to our supporters
                </h1>
                <p className="mt-5 max-w-2xl text-lg text-[#dff5f8]">
                  A live look at recent prize wins from the Spin4Chinuch wheel.
                </p>
              </div>

              <Link href="/spin" className="rounded-full bg-[#d6a84f] px-8 py-4 font-black text-[#12304a] shadow-xl transition hover:scale-105">
                Spin Now
              </Link>
            </div>

            <div className="mt-12 overflow-hidden rounded-2xl cy-card-dark shadow-2xl">
              {loading ? (
                <div className="p-8 text-center text-gray-200">Loading winners...</div>
              ) : wins.length === 0 ? (
                <div className="p-8 text-center text-gray-200">No winners yet. Be the first one on the board.</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {wins.map((win) => (
                    <div key={win.id} className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d6a84f] text-[#12304a]">
                          <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black">{win.prize}</h2>
                          <p className="text-sm text-[#dff5f8]">{maskEmail(win.user_email)}</p>
                        </div>
                      </div>

                      <p className="text-[#dff5f8]">
                        {new Date(win.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
