"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";

import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import ActionCard from "@/components/ui/ActionCard";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";

import {
  DollarSign,
  Ticket,
  CircleDashed,
  Trophy,
  Shield,
} from "lucide-react";

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

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setEmail(user.email || "");

    const profileReq = supabase
      .from("profiles")
      .select(
        "spins_remaining, spins_purchased, total_donations, role"
      )
      .eq("id", user.id)
      .single();

    const winsReq = supabase
      .from("wins")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const [{ data: profile }, { data: winsData }] =
      await Promise.all([profileReq, winsReq]);

    if (profile) {
      setSpinsLeft(profile.spins_remaining ?? 0);
      setSpinsPurchased(profile.spins_purchased ?? 0);
      setDonations(profile.total_donations ?? 0);
      setRole(profile.role ?? "");
    }

    if (winsData) setWins(winsData);
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">

        {/* Background blobs */}

        <div className="pointer-events-none absolute inset-0">

          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />

        </div>

        <div className="relative mx-auto max-w-7xl px-8 py-10 space-y-10">

          {/* HERO */}

          <Card className="overflow-hidden bg-gradient-to-r from-[#142A52] via-[#28457B] to-[#4267A8] text-white">

            <div className="flex flex-col gap-10 p-10 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="text-sm uppercase tracking-[0.35em] text-blue-200">
                  Welcome Back
                </p>

                <h1 className="mt-2 text-6xl font-black">
                  Dashboard
                </h1>

                <p className="mt-3 text-blue-100">
                  {email}
                </p>

                <p className="mt-6 max-w-xl text-lg text-blue-100">
                  Supporting Chinuch Yehudi one spin at a time.
                </p>

              </div>

              <Button href="/spin" variant="gold">
               Spin Now
              </Button>

            </div>

          </Card>

          {/* STATS */}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              label="Total Donations"
              value={`$${donations}`}
              icon={<DollarSign size={24} />}
            />

            <StatCard
              label="Spins Purchased"
              value={spinsPurchased}
              icon={<Ticket size={24} />}
            />

            <StatCard
              label="Spins Left"
              value={spinsLeft}
              icon={<CircleDashed size={24} />}
            />

            <StatCard
              label="Wins"
              value={wins.length}
              icon={<Trophy size={24} />}
            />

          </div>

          {/* ACTIONS */}

          <div className="grid gap-8 lg:grid-cols-2">

            <ActionCard
              title="Spin the Wheel"
              description="Use one of your available spins for a chance to win exciting prizes."
              href="/spin"
              buttonText="Spin Now"
              icon={<CircleDashed size={30} />}
            />

            <ActionCard
              title="Buy More Spins"
              buttonText="Buy Spins"
              description="Support Chinuch and increase your chances of winning premium prizes."
              href="/buy-spins"
              icon={<Ticket size={30} />}
            />

          </div>

          {/* RECENT WINS */}

          <Panel
            title="🏆 Recent Wins"
            subtitle="Your latest prizes"
          >

            {wins.length === 0 ? (

              <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">

                <div className="text-6xl">
                  🎁
                </div>

                <h3 className="mt-6 text-2xl font-bold text-[#142A52]">
                  No wins yet
                </h3>

                <p className="mt-3 text-slate-500">
                  Start spinning to win amazing prizes.
                </p>

              </div>

            ) : (

              <div className="space-y-5">

                {wins.map((win) => (

                  <div
                    key={win.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >

                    <div>

                      <h3 className="text-xl font-bold text-[#142A52]">
                        {win.prize}
                      </h3>

                      <p className="mt-1 text-slate-500">
                        {new Date(
                          win.created_at
                        ).toLocaleDateString()}
                      </p>

                    </div>

                    <div className="rounded-full bg-[#EEF4FF] px-5 py-2 font-semibold text-[#4267A8]">
                      🏆 Won
                    </div>

                  </div>

                ))}

              </div>

            )}

          </Panel>

          {/* ADMIN */}

          {role === "admin" && (

            <Panel
              title="👑 Admin Tools"
              subtitle="Administrative actions"
            >

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

                <ActionCard
                  title="Users"
                  description="Manage registered users"
                  buttonText="Manage Users"
                  href="/admin/users"
                  icon={<Shield size={24} />}
                />

                <ActionCard
                  title="Prizes"
                  description="Manage available prizes"
                  buttonText="Manage Prizes"
                  href="/admin/prizes"
                  icon={<Trophy size={24} />}
                />

                <ActionCard
                  title="Winners"
                  description="View winning history"
                  buttonText="View Winners"
                  href="/admin/winners"
                  icon={<Ticket size={24} />}
                />

                <ActionCard
                  title="Dashboard"
                  description="Open admin dashboard"
                  buttonText="Admin Dashboard"
                  href="/admin"
                  icon={<DollarSign size={24} />}
                />

              </div>

            </Panel>

          )}

        </div>

      </div>
    </ProtectedRoute>
  );
}