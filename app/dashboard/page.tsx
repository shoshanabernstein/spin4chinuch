"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="text-gray-600 mt-2">
            Welcome back, {email}
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <p className="text-gray-500 mb-2">
              Available Spins
            </p>

            <h2 className="text-6xl font-bold text-blue-600">
              {spins}
            </h2>
          </div>

          <div className="bg-green-500 text-white rounded-3xl shadow-lg p-8">
            <p className="opacity-90">
              Support Jewish Education
            </p>

            <h2 className="text-3xl font-bold mt-2">
              Every Spin Helps
            </h2>
          </div>

          <div className="bg-purple-500 text-white rounded-3xl shadow-lg p-8">
            <p className="opacity-90">
              Your Prizes Won
            </p>

            <h2 className="text-5xl font-bold mt-2">
              {wins.length}
            </h2>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">

          <Link
            href="/buy-spins"
            className="bg-green-600 hover:bg-green-700 text-white rounded-3xl p-8 shadow-lg transition"
          >
            <h2 className="text-3xl font-bold">
              🎟 Buy Spins
            </h2>

            <p className="mt-2 opacity-90">
              Purchase more chances to win prizes.
            </p>
          </Link>

          <Link
            href="/spin"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-3xl p-8 shadow-lg transition"
          >
            <h2 className="text-3xl font-bold">
              🎡 Spin The Wheel
            </h2>

            <p className="mt-2 opacity-90">
              Try your luck and win instantly.
            </p>
          </Link>

        </div>

        {/* Recent Wins */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-10">

          <h2 className="text-3xl font-bold mb-6">
            🏆 Recent Wins
          </h2>

          {wins.length === 0 ? (
            <p className="text-gray-500">
              No prizes won yet.
            </p>
          ) : (
            <div className="space-y-3">
              {wins.map((win) => (
                <div
                  key={win.id}
                  className="bg-gray-100 rounded-xl p-4"
                >
                  {win.prize}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin */}
        {role === "admin" && (
          <div className="bg-red-600 text-white rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold">
              Admin Controls
            </h2>

            <p className="mt-2 opacity-90">
              Manage prizes, inventory, and winners.
            </p>

            <Link
              href="/admin"
              className="inline-block mt-6 bg-white text-red-600 font-bold px-6 py-3 rounded-xl"
            >
              Open Admin Panel
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}