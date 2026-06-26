"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPrizes() {
    setLoading(true);

    const { data } = await supabase
      .from("prizes")
      .select("*")
      .order("created_at", { ascending: true });

    setPrizes(data || []);
    setLoading(false);
  }

  async function deletePrize(id: string) {
    const confirmed = confirm("Delete this prize?");

    if (!confirmed) return;

    await supabase.from("prizes").delete().eq("id", id);

    loadPrizes();
  }

  useEffect(() => {
    loadPrizes();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-10">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-extrabold text-blue-700">
              Admin Dashboard
            </h1>

            <p className="text-gray-500 mt-2">
              Manage your Spin4Chinuch prizes
            </p>
          </div>

          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="text-4xl">🎁</div>

            <p className="text-gray-500 mt-4">
              Total Prizes
            </p>

            <h2 className="text-4xl font-bold text-blue-600">
              {prizes.length}
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="text-4xl">🏆</div>

            <p className="text-gray-500 mt-4">
              Active
            </p>

            <h2 className="text-4xl font-bold text-green-600">
              {prizes.filter(p => p.active).length}
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="text-4xl">❌</div>

            <p className="text-gray-500 mt-4">
              Disabled
            </p>

            <h2 className="text-4xl font-bold text-red-600">
              {prizes.filter(p => !p.active).length}
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <Link
              href="/admin/new-prize"
              className="flex items-center justify-center h-full text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 hover:scale-105 transition"
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
                className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition"
              >
                <div className="flex justify-between items-start">

                  <div>
                    <h2 className="text-2xl font-bold text-blue-700">
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