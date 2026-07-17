"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import PrizeWheel from "@/components/PrizeWheel/PrizeWheel";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";

type Outcome = {
  id: number;
  label: string;
  prize_id: number | null;
};

type SpinResponse = {
  success?: boolean;
  error?: string;
  outcomeId?: number;
  outcomeLabel?: string;
  remainingSpins?: number;
  won?: boolean;
  winner?: {
    prize?: { name?: string } | null;
  };
};

const SPIN_DURATION = 7500;

export default function SpinPage() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState("");
  const [didWin, setDidWin] = useState(false);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loadingWheel, setLoadingWheel] = useState(true);
  const [remainingSpins, setRemainingSpins] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const spinSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void Promise.all([loadOutcomes(), loadBalance()]);

    return () => {
      if (resultTimer.current) clearTimeout(resultTimer.current);
    };
  }, []);

  async function loadOutcomes() {
    setLoadingWheel(true);

    // This public view already limits results to active, available outcomes.
    // It intentionally does not expose an `active` column.
    let result = await supabase
      .from("public_wheel_outcomes")
      .select("id,label,prize_id")
      .order("created_at", { ascending: true });

    // Support databases where the public-view migration has not been applied yet.
    if (result.error) {
      result = await supabase
        .from("wheel_outcomes")
        .select("id,label,prize_id")
        .eq("active", true)
        .order("created_at", { ascending: true });
    }

    if (result.error) {
      console.error("Unable to load wheel outcomes:", result.error);
      setOutcomes([]);
      toast.error(`The prize wheel could not be loaded: ${result.error.message}`);
    } else {
      setOutcomes((result.data as Outcome[] | null) ?? []);
    }

    setLoadingWheel(false);
  }

  async function loadBalance() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("remaining_spins")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Unable to load spin balance:", error);
      return;
    }

    setRemainingSpins(data.remaining_spins ?? 0);
  }

  function stopSpinSound() {
    if (!spinSound.current) return;
    spinSound.current.pause();
    spinSound.current.currentTime = 0;
  }

  async function spin() {
    if (spinning || loadingWheel) return;

    if (outcomes.length === 0) {
      toast.error("No wheel outcomes are available right now.");
      return;
    }

    if (remainingSpins <= 0) {
      toast.error("You do not have any spins remaining.");
      return;
    }

    setSpinning(true);
    setWinner("");
    setDidWin(false);
    setShowConfetti(false);

    if (spinSound.current) {
      spinSound.current.currentTime = 0;
      void spinSound.current.play().catch(() => undefined);
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      stopSpinSound();
      toast.error("Your session expired. Please log in again.");
      setSpinning(false);
      return;
    }

    let response: Response;

    try {
      response = await fetch("/api/spin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch {
      stopSpinSound();
      toast.error("Could not connect. Your spin was not used.");
      setSpinning(false);
      return;
    }

    const data = (await response.json()) as SpinResponse;

    if (!response.ok || !data.success || data.outcomeId === undefined) {
      stopSpinSound();
      toast.error(data.error ?? "Unable to spin right now.");
      setSpinning(false);
      return;
    }

    const index = outcomes.findIndex((outcome) => outcome.id === data.outcomeId);

    if (index < 0) {
      stopSpinSound();
      toast.error("The wheel changed. Please try again.");
      await loadOutcomes();
      setSpinning(false);
      return;
    }

    const sliceAngle = 360 / outcomes.length;
    const desiredAngle = 360 - (index * sliceAngle + sliceAngle / 2);
    const currentAngle = ((rotation % 360) + 360) % 360;
    const landingOffset = ((desiredAngle - currentAngle) % 360 + 360) % 360;

    setRotation(rotation + 360 * 7 + landingOffset);
    setRemainingSpins(data.remainingSpins ?? Math.max(remainingSpins - 1, 0));

    resultTimer.current = setTimeout(() => {
      stopSpinSound();

      const won = Boolean(data.won);
      const resultLabel =
        data.winner?.prize?.name ?? data.outcomeLabel ?? "Try Again";

      if (won && winSound.current) {
        winSound.current.currentTime = 0;
        void winSound.current.play().catch(() => undefined);
      }

      setWinner(resultLabel);
      setDidWin(won);
      setShowConfetti(won);
      setSpinning(false);

      if (won) {
        setTimeout(() => setShowConfetti(false), 4500);
      }
    }, SPIN_DURATION);
  }

  const canSpin = !spinning && !loadingWheel && outcomes.length > 0;

  return (
    <ProtectedRoute>
      <main className="min-h-screen cy-dark-page px-4 py-12 text-white sm:px-6">
        {showConfetti && <Confetti recycle={false} numberOfPieces={350} />}

        <div className="mx-auto flex max-w-6xl flex-col items-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#8fe5ef]">
            Spin4Chinuch
          </p>
          <h1 className="mt-3 text-center text-5xl font-black md:text-7xl">
            Spin to Win
          </h1>
          <p className="mt-4 text-center text-lg text-blue-100">
            Every spin supports Jewish education.
          </p>

          <div className="mt-5 rounded-full border border-white/15 bg-white/10 px-5 py-2 font-bold">
            {remainingSpins} {remainingSpins === 1 ? "spin" : "spins"} remaining
          </div>

          <div className="mt-10 flex min-h-[420px] w-full items-center justify-center">
            {loadingWheel ? (
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#d6a84f]" />
                <p className="mt-4 font-bold">Loading the prize wheel…</p>
              </div>
            ) : outcomes.length === 0 ? (
              <div className="max-w-lg rounded-3xl border border-white/10 bg-white/10 p-8 text-center">
                <h2 className="text-2xl font-black">The wheel is unavailable</h2>
                <p className="mt-3 text-blue-100">
                  No active outcomes could be loaded. Check the Supabase migration and wheel outcomes table.
                </p>
                <button
                  type="button"
                  onClick={() => void loadOutcomes()}
                  className="mt-6 rounded-xl bg-[#d6a84f] px-6 py-3 font-black text-[#12304a]"
                >
                  Try again
                </button>
              </div>
            ) : (
              <PrizeWheel
                rotation={rotation}
                spinning={spinning}
                prizes={outcomes}
                canSpin={canSpin}
                onSpin={() => void spin()}
              />
            )}
          </div>

          {!loadingWheel && outcomes.length > 0 && (
            <p className="mt-5 text-center text-blue-100">
              Press the center of the wheel to spin.
            </p>
          )}

          {remainingSpins <= 0 && !loadingWheel && (
            <Link
              href="/buy-spins"
              className="mt-7 rounded-2xl bg-gradient-to-r from-[#d6a84f] to-[#16a6b8] px-8 py-4 text-xl font-black text-white"
            >
              Buy Spins
            </Link>
          )}

          {winner && (
            <div className="mt-10 w-full max-w-xl rounded-3xl border border-[#d6a84f] bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
              <h2 className="text-4xl font-black text-[#8fe5ef]">
                {didWin ? "Congratulations!" : "Thanks for spinning!"}
              </h2>
              <p className="mt-5 text-xl">{didWin ? "You won:" : "Your result:"}</p>
              <p className="mt-3 text-4xl font-black text-[#d6a84f]">{winner}</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setWinner("")}
                  className="rounded-xl bg-[#0f8db3] px-6 py-3 font-bold"
                >
                  Close
                </button>
                <Link href="/dashboard" className="rounded-xl bg-[#d6a84f] px-6 py-3 font-bold text-[#12304a]">
                  Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>

        <audio ref={spinSound} src="/sounds/spin.mp3" preload="auto" />
        <audio ref={winSound} src="/sounds/win.mp3" preload="auto" />
      </main>
    </ProtectedRoute>
  );
}
