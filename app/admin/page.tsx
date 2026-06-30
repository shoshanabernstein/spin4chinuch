/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Prize = { id: string; name: string; quantity: number; probability: number; active: boolean; created_at: string; };

export default function AdminPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrizes = useCallback(async () => {

    const { data } = await supabase
      .from("prizes")
      .select("*")
      .order("created_at", { ascending: true });

    setPrizes(data || []);
    setLoading(false);
  }, []);

  async function deletePrize(id: string) {
    const confirmed = confirm("Delete this prize?");

    if (!confirmed) return;

    await supabase.from("prizes").delete().eq("id", id);

    void loadPrizes();
  }

  useEffect(() => {
    void loadPrizes();
  }, [loadPrizes]);

  return (
    <main className="min-h-screen cy-page p-10">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-extrabold text-[#12304a]">
              Admin Dashboard
            </h1>

            <p className="text-slate-500 mt-2">
              Manage your Spin4Chinuch prizes
            </p>
          </div>

          <Link
            href="/dashboard"
            className="bg-[#0f8db3] hover:bg-[#12304a] text-white px-6 py-3 rounded-xl"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">

          <div className="cy-card rounded-3xl p-6">
            <div className="text-4xl">🎁</div>

            <p className="text-slate-500 mt-4">
              Total Prizes
            </p>

            <h2 className="text-4xl font-bold text-[#0f8db3]">
              {prizes.length}
            </h2>
          </div>

          <div className="cy-card rounded-3xl p-6">
            <div className="text-4xl">🏆</div>

            <p className="text-slate-500 mt-4">
              Active
            </p>

            <h2 className="text-4xl font-bold text-green-600">
              {prizes.filter(p => p.active).length}
            </h2>
          </div>

          <div className="cy-card rounded-3xl p-6">
            <div className="text-4xl">❌</div>

            <p className="text-slate-500 mt-4">
              Disabled
            </p>

            <h2 className="text-4xl font-bold text-red-600">
              {prizes.filter(p => !p.active).length}
            </h2>
          </div>

          <div className="cy-card rounded-3xl p-6">
            <Link
              href="/admin/new-prize"
              className="flex items-center justify-center h-full text-xl font-bold bg-gradient-to-r from-[#0f8db3] to-[#12304a] text-white rounded-2xl p-5 hover:scale-105 transition"
            >
              ➕ Add Prize
            </Link>
          </div>

        </div>

        {loading ? (
          <div className="text-center text-2xl">
            Loading...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            {prizes.map((prize) => (
              <div
                key={prize.id}
                className="cy-card rounded-3xl p-6 hover:shadow-2xl transition"
              >
                <div className="flex justify-between items-start">

                  <div>
                    <h2 className="text-2xl font-bold text-[#12304a]">
                      {prize.name}
                    </h2>

                    <p className="mt-3 text-gray-600">
                      Remaining:{" "}
                      <span className="font-bold">
                        {prize.quantity}
                      </span>
                    </p>

                    <p className="text-gray-600">
                      Probability:{" "}
                      <span className="font-bold">
                        {prize.probability}
                      </span>
                    </p>

                    <p
                      className={`mt-4 font-semibold ${prize.active
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                    >
                      {prize.active ? "🟢 Active" : "🔴 Disabled"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">


                  <Link href={`/admin/edit/${prize.id}`}>
                    Edit
                  </Link>

                  <button
                    onClick={() => deletePrize(prize.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl"
                  >
                    Delete
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </main>
  );
}