"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "@/components/Navbar";


export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [spins, setSpins] = useState(0);
  const [wins, setWins] = useState<any[]>([]);
  const [role, setRole] = useState("");

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("spins_remaining, role")
      .eq("id", user.id)
      .single();

    if (profile) {
      setSpins(profile.spins_remaining);
      setRole(profile.role);
    }

    const { data: winsData } = await supabase
      .from("wins")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (winsData) {
      setWins(winsData);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-24 bg-[radial-gradient(circle_at_top,#1E3A8A_0%,#0F172A_55%,#020617_100%)]">

        <div className="max-w-7xl mx-auto px-8 py-12">

          {/* Header */}

          <div className="flex flex-col md:flex-row justify-between items-center mb-12">

            <div>
              <h1 className="text-6xl font-black">
                Dashboard
              </h1>

              <p className="text-yellow-300 mt-3 text-lg">
                Welcome back
              </p>

              <p className="text-gray-300">
                {email}
              </p>
            </div>

            <Link
              href="/spin"
              className="mt-8 md:mt-0 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 px-10 py-5 font-black text-[#142A52] shadow-2xl hover:scale-105 transition"
            >
              🎡 Spin Now
            </Link>

          </div>

          {/* Stats */}

          <div className="grid lg:grid-cols-3 gap-8 mb-12">

            <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">

              <p className="text-gray-300 uppercase tracking-widest">
                Spins Remaining
              </p>

              <h2 className="text-7xl font-black text-yellow-400 mt-3">
                {spins}
              </h2>

            </div>

            <div className="rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-500/20 to-yellow-700/10 backdrop-blur-xl p-8 shadow-2xl">

              <p className="uppercase tracking-widest text-yellow-200">
                Your Impact
              </p>

              <h2 className="text-4xl font-black mt-4">
                Supporting Jewish Education
              </h2>

              <p className="mt-4 text-gray-300">
                Every spin helps strengthen Chinuch.
              </p>

            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">

              <p className="uppercase tracking-widest text-gray-300">
                Total Wins
              </p>

              <h2 className="text-7xl font-black text-green-400 mt-3">
                {wins.length}
              </h2>

            </div>

          </div>

          {/* Actions */}

          <div className="grid md:grid-cols-2 gap-8 mb-12">

            <Link
              href="/buy-spins"
              className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-700 p-10 shadow-2xl hover:scale-[1.02] transition"
            >
              <h2 className="text-4xl font-black">
                🎟 Buy Spins
              </h2>

              <p className="mt-4 text-green-100 text-lg">
                Purchase more chances to win premium prizes.
              </p>

            </Link>

            <Link
              href="/spin"
              className="rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-700 p-10 shadow-2xl hover:scale-[1.02] transition"
            >
              <h2 className="text-4xl font-black">
                🎡 Spin the Wheel
              </h2>

              <p className="mt-4 text-purple-100 text-lg">
                Spin instantly for amazing prizes.
              </p>

            </Link>

          </div>

          {/* Recent Wins */}

          <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl p-10 mb-12">

            <h2 className="text-4xl font-black mb-8">
              🏆 Recent Wins
            </h2>

            {wins.length === 0 ? (

              <div className="text-center py-16">

                <div className="text-6xl mb-5">
                  🎁
                </div>

                <p className="text-gray-400 text-xl">
                  You haven't won any prizes yet.
                </p>

              </div>

            ) : (

              <div className="space-y-5">

                {wins.map((win) => (

                  <div
                    key={win.id}
                    className="rounded-2xl bg-black/20 border border-yellow-500/20 p-6 flex justify-between items-center"
                  >

                    <div>

                      <h3 className="font-bold text-2xl">
                        {win.prize}
                      </h3>

                      <p className="text-gray-400">
                        {new Date(win.created_at).toLocaleDateString()}
                      </p>

                    </div>

                    <div className="text-4xl">
                      🏆
                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* Admin */}

          {role === "admin" && (

            <div className="rounded-3xl bg-gradient-to-r from-red-700 to-red-900 p-10 shadow-2xl border border-red-500">

              <h2 className="text-4xl font-black">
                👑 Admin Panel
              </h2>

              <p className="mt-4 text-red-100 text-lg">
                Manage prizes, inventory, users, and winners.
              </p>

              <Link
                href="/admin"
                className="inline-block mt-8 rounded-full bg-white px-8 py-4 font-black text-red-700 hover:scale-105 transition"
              >
                Open Dashboard
              </Link>

            </div>

          )}

        </div>

      </main>
    </>
  );
}