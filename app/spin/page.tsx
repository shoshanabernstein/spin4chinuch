"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Confetti from "react-confetti";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

import PrizeWheel from "@/components/PrizeWheel/PrizeWheel";

import Panel from "@/components/ui/Panel";
import StatCard from "@/components/ui/StatCard";

import {
  Ticket,
  Trophy,
  CircleDashed,
  DollarSign,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Outcome = {
  id: number;
  label: string;
  prize_id: number | null;
};

export default function SpinPage() {
  /* -----------------------------
   * Wheel State
   * ---------------------------- */

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const [winner, setWinner] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  /* -----------------------------
   * Wheel Data
   * ---------------------------- */

  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);

  /* -----------------------------
   * User Stats
   * ---------------------------- */

  const [remainingSpins, setRemainingSpins] = useState(0);
  const [totalSpins, setTotalSpins] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalWins, setTotalWins] = useState(0);

  /* -----------------------------
   * Audio
   * ---------------------------- */

  const spinSound = useRef<HTMLAudioElement>(null);
  const winSound = useRef<HTMLAudioElement>(null);

  /* -----------------------------
   * Computed State
   * ---------------------------- */

  const canSpin =
    !spinning &&
    !loadingPrizes &&
    remainingSpins > 0 &&
    outcomes.length > 0;

  /* -----------------------------
   * Initial Load
   * ---------------------------- */

  useEffect(() => {
    loadOutcomes();
    loadUserStats();
  }, []);

  /* -----------------------------
   * Load Wheel
   * ---------------------------- */

  async function loadOutcomes() {
    setLoadingPrizes(true);

    const { data, error } = await supabase
      .from("wheel_outcomes")
      .select(`
        id,
        label,
        prize_id
      `)
      .eq("active", true)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      setOutcomes([]);
    } else {
      setOutcomes(data ?? []);
    }

    setLoadingPrizes(false);
  }

  /* -----------------------------
   * Load User Stats
   * ---------------------------- */

  async function loadUserStats() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const profileReq = supabase
      .from("profiles")
      .select("remaining_spins,total_spins")
      .eq("id", user.id)
      .single();

    const winsReq = supabase
      .from("wins")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id);

    const paymentsReq = supabase
      .from("payment_logs")
      .select("amount")
      .eq("user_id", user.id);

    const [
      { data: profile },
      { count: wins },
      { data: payments },
    ] = await Promise.all([
      profileReq,
      winsReq,
      paymentsReq,
    ]);

    if (profile) {
      setRemainingSpins(profile.remaining_spins ?? 0);
      setTotalSpins(profile.total_spins ?? 0);
    }

    setTotalWins(wins ?? 0);

    const donated = (payments ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0
    );

    setTotalDonations(donated / 100);
  }

  /* -----------------------------
  * Spin
  * ---------------------------- */

  async function spin() {
    if (!canSpin) return;

    setSpinning(true);
    setWinner("");

    // Play spin sound
    if (spinSound.current) {
      spinSound.current.currentTime = 0;

      spinSound.current
        .play()
        .catch(() => { });
    }

    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setSpinning(false);
      return;
    }

    // Call API
    const response = await fetch("/api/spin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error(data.error);
      setSpinning(false);
      return;
    }

    // Find winning slice
    const index = outcomes.findIndex(
      (o) => o.id === data.outcomeId
    );

    if (index === -1) {
      console.error("Wheel outcomes changed.");

      await loadOutcomes();

      setSpinning(false);

      return;
    }

    // Calculate target rotation
    const sliceAngle = 360 / outcomes.length;

    const targetRotation =
      rotation +
      360 * 8 +
      (
        360 -
        (
          index * sliceAngle +
          sliceAngle / 2
        )
      );

    setRotation(targetRotation);

    // Wait for animation
    setTimeout(async () => {

      // Stop spin sound
      if (spinSound.current) {
        spinSound.current.pause();
        spinSound.current.currentTime = 0;
      }

      // Winner sound
      if (winSound.current) {
        winSound.current.currentTime = 0;

        winSound.current
          .play()
          .catch(() => { });
      }

      setWinner(data.prize);

      setShowConfetti(true);

      setSpinning(false);

      // Refresh page data
      await Promise.all([
        loadOutcomes(),
        loadUserStats(),
      ]);

      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

    }, 9000);
  }

  /* -----------------------------
   * Page
   * ---------------------------- */

  return (
    <ProtectedRoute>
      <>
        <Navbar />

        <main className="relative min-h-screen overflow-hidden bg-white pt-24">

          {/* Background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
          </div>

          {showConfetti && (
            <Confetti
              recycle={false}
              numberOfPieces={400}
            />
          )}

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">

            {/* Hero */}
            <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-white p-6 sm:p-8 shadow-lg">

              <Image
                src="/wheel-watermark.png"
                alt=""
                aria-hidden
                width={1200}
                height={1200}
                className="
                pointer-events-none
                absolute
                right-[-180px]
                top-1/2
                w-[700px]
                -translate-y-1/2
                opacity-15
                select-none
              "
              />

              <div className="relative">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4267A8]">
                  Spin &amp; Win
                </p>

                <h1 className="mt-2 text-4xl font-black text-[#142A52]">
                  Ready to Spin?
                </h1>

                <p className="mt-3 max-w-xl text-slate-500">
                  Every spin supports Chinuch Yehudi while giving you the
                  opportunity to win incredible prizes.
                </p>
              </div>

            </section>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-[1.65fr_.8fr]">

              {/* Wheel */}
              <Panel
                title="Prize Wheel"
                subtitle="Click the center of the wheel to spin."
              >
                <div className="flex items-center justify-center py-6">

                  <PrizeWheel
                    rotation={rotation}
                    spinning={spinning}
                    prizes={outcomes}
                  />

                </div>

                {!loadingPrizes && outcomes.length === 0 && (

                  <div className="rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">

                    <div className="text-5xl">🎁</div>

                    <h3 className="mt-4 text-xl font-bold text-[#142A52]">
                      No prizes available
                    </h3>

                    <p className="mt-2 text-slate-500">
                      Please check back later.
                    </p>

                  </div>

                )}

              </Panel>

              {/* Stats */}
              <Panel
                title="Your Stats"
                subtitle="Your fundraiser activity"
              >

                <div className="grid gap-5">

                  <StatCard
                    label="Spins Left"
                    value={remainingSpins}
                    icon={<Ticket />}
                  />

                  <StatCard
                    label="Total Spins"
                    value={totalSpins}
                    icon={<CircleDashed />}
                  />

                  <StatCard
                    label="Wins"
                    value={totalWins}
                    icon={<Trophy />}
                  />

                  <StatCard
                    label="Total Donated"
                    value={`$${totalDonations}`}
                    icon={<DollarSign />}
                  />

                </div>

              </Panel>

            </div>
            {/* Winner Modal */}

            {winner && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">

                <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl">

                  {/* Top Glow */}

                  <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-yellow-200/40 to-transparent" />

                  <div className="relative p-10 text-center">

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg">

                      <Trophy className="h-10 w-10 text-white" />

                    </div>

                    <p className="mt-6 text-sm font-bold uppercase tracking-[0.35em] text-[#4267A8]">
                      Congratulations
                    </p>

                    <h2 className="mt-3 text-4xl font-black text-[#142A52]">
                      You Won!
                    </h2>

                    <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">

                      <p className="text-sm font-semibold uppercase tracking-wider text-yellow-700">
                        Your Prize
                      </p>

                      <p className="mt-3 text-3xl font-black text-[#142A52]">
                        {winner}
                      </p>

                    </div>

                    <div className="mt-8 flex flex-col gap-4 sm:flex-row">

                      <button
                        onClick={() => setWinner("")}
                        disabled={remainingSpins <= 0}
                        className="
                        flex-1
                        rounded-2xl
                        bg-[#142A52]
                        px-6
                        py-4
                        font-bold
                        text-white
                        transition
                        hover:scale-[1.02]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                      >
                        {remainingSpins > 0
                          ? "Spin Again"
                          : "No Spins Left"}
                      </button>

                      <Link
                        href="/dashboard"
                        className="
                        flex-1
                        rounded-2xl
                        border
                        border-slate-200
                        px-6
                        py-4
                        text-center
                        font-bold
                        text-[#142A52]
                        transition
                        hover:bg-slate-50
                      "
                      >
                        Dashboard
                      </Link>

                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

          <audio
            ref={spinSound}
            src="/sounds/spin.mp3"
            preload="auto"
          />

          <audio
            ref={winSound}
            src="/sounds/win.mp3"
            preload="auto"
          />

        </main>

      </>
    </ProtectedRoute>
  );
}