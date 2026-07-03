"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";

import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";

type Win = {
  id: string;
  prize: string;
  created_at: string;
};

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [spinsPurchased, setSpinsPurchased] = useState(0);
  const [donations, setDonations] = useState(0);
  const [wins, setWins] = useState<Win[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setEmail(user.email || "");

    const profileReq = supabase
      .from("profiles")
      .select("spins_remaining, role, spins_purchased, total_donations")
      .eq("id", user.id)
      .single();

    const winsReq = supabase
      .from("wins")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const [{ data: profile }, { data: winsData }] = await Promise.all([
      profileReq,
      winsReq,
    ]);

    if (profile) {
      setSpinsLeft(profile.spins_remaining || 0);
      setSpinsPurchased(profile.spins_purchased || 0);
      setDonations(profile.total_donations || 0);
      setRole(profile.role || "");
    }

    if (winsData) setWins(winsData);

    setLoading(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <ProtectedRoute>
      <main className="min-h-screen pt-24 px-8">

        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-5xl font-black">Dashboard</h1>
              <p className="text-white/60">{email}</p>
            </div>

            <div className="flex gap-4">
              <Button href="/buy-spins" variant="green">
                Buy Spins
              </Button>

              <Button href="/spin" variant="gold">
                Spin Now
              </Button>
            </div>
          </div>

          {/* TOP STATS */}
          <div className="grid md:grid-cols-4 gap-6 mb-10">
            <StatCard label="Total Donations" value={`$${donations}`} color="text-green-400" />
            <StatCard label="Spins Purchased" value={spinsPurchased} color="text-blue-300" />
            <StatCard label="Spins Left" value={spinsLeft} color="text-yellow-400" />
            <StatCard label="Wins" value={wins.length} color="text-purple-400" />
          </div>

          {/* ACTIONS */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <Button href="/buy-spins" variant="green" className="p-10 text-left">
              🎟 Buy Spins
            </Button>

            <Button href="/spin" variant="primary" className="p-10 text-left">
              🎡 Spin the Wheel
            </Button>
          </div>

          {/* WIN HISTORY */}
          <Panel title="🏆 Win History">
            {wins.length === 0 ? (
              <p className="text-white/50">No wins yet — start spinning 🎡</p>
            ) : (
              <div className="space-y-4">
                {wins.map((win) => (
                  <Card key={win.id} className="p-5 flex justify-between">
                    <div>
                      <p className="text-xl font-bold">{win.prize}</p>
                      <p className="text-white/50 text-sm">
                        {new Date(win.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-2xl">🏆</div>
                  </Card>
                ))}
              </div>
            )}
          </Panel>

          {/* ADMIN */}
          {role === "admin" && (
            <div className="mt-10">
              <Panel title="👑 Admin Panel">
                <p className="text-white/70 mb-6">
                  Manage users, prizes, and system settings.
                </p>

                <Button href="/admin" variant="primary">
                  Open Admin Dashboard
                </Button>
              </Panel>
            </div>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}