"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import Panel from "@/components/ui/Panel";
import StatCard from "@/components/ui/StatCard";

import { Trophy, MapPin, Gift } from "lucide-react";

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

  useEffect(() => {
    async function loadWinners() {
      const { data, error } = await supabase
        .from("wins")
        .select(`
          id,
          created_at,
          prizes ( name ),
          profiles ( first_name, last_name, city )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error loading winners:", error);
        setLoading(false);
        return;
      }

      const formatted: Winner[] = (data || []).map((w: any) => {
        const first = w.profiles?.first_name ?? "";
        const last = w.profiles?.last_name ?? "";

        const initials =
          ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "??";

        return {
          id: w.id,
          prize: w.prizes?.name ?? "Unknown Prize",
          created_at: w.created_at,
          city: w.profiles?.city ?? "Unknown",
          initials,
        };
      });

      setWinners(formatted);
      setLoading(false);
    }

    loadWinners();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf7f0]">

      {/* background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 space-y-8">

        {/* HEADER */}
        <Panel title="">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>
              <h1 className="text-4xl font-black text-[#142A52]">
                Winners Board
              </h1>
              <p className="mt-2 text-slate-500 max-w-xl">
                Every spin supports Chinuch Yehudi
              </p>
            </div>

          </div>
        </Panel>

        {/* STATS */}
        <div className="grid gap-5 sm:grid-cols-3">

          <StatCard
            label="Total Winners"
            value={winners.length}
            icon={<Trophy />}
          />

          <StatCard
            label="Latest Prize"
            value={winners[0]?.prize ?? "—"}
            icon={<Gift />}
          />

          <StatCard
            label="Latest City"
            value={winners[0]?.city ?? "—"}
            icon={<MapPin />}
          />
        </div>

        {/* TABLE */}
        <Panel title="Recent Winners" subtitle="Updated automatically">

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              Loading winners...
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

              {/* header */}
              <div className="grid grid-cols-[60px_1fr_1fr] bg-slate-50 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <div>Player</div>
                <div>Prize</div>
                <div>City</div>
              </div>

              {/* rows */}
              {winners.map((w) => {
                const initials = w.initials || "??";

                return (
                  <div
                    key={w.id}
                    className="grid grid-cols-[60px_1fr_1fr] items-center px-6 py-5 border-t border-slate-100 hover:bg-slate-50 transition-colors"
                  >

                    {/* initials */}
                    <div className="flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-[#142A52] text-white flex items-center justify-center font-bold">
                        {initials}
                      </div>
                    </div>

                    {/* prize */}
                    <div className="min-w-0">
                      <p className="font-semibold text-[#142A52] truncate">
                        {w.prize}
                      </p>
                    </div>

                    {/* city */}
                    <div className="text-slate-500 text-sm">
                      {w.city}
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </Panel>

      </div>
    </div>
  );
}