"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CircleDashed,
  DollarSign,
  Gift,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  X,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import PrizeWheel from "@/components/PrizeWheel/PrizeWheel";
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
    prize?: {
      name?: string;
    } | null;
  };
};

const SPIN_DURATION = 7500;

export default function SpinPage() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState("");
  const [didWin, setDidWin] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const [remainingSpins, setRemainingSpins] = useState(0);
  const [totalSpins, setTotalSpins] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalWins, setTotalWins] = useState(0);

  const spinSound = useRef<HTMLAudioElement>(null);
  const winSound = useRef<HTMLAudioElement>(null);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readyToSpin =
    !spinning &&
    !loadingPrizes &&
    !loadingStats &&
    remainingSpins > 0 &&
    outcomes.length > 0;

  useEffect(() => {
    void Promise.all([loadOutcomes(), loadUserStats()]);

    return () => {
      if (resultTimer.current) clearTimeout(resultTimer.current);
      if (confettiTimer.current) clearTimeout(confettiTimer.current);
    };
  }, []);

  async function loadOutcomes() {
    setLoadingPrizes(true);

    const { data, error } = await supabase
      .from("wheel_outcomes")
      .select("id,label,prize_id")
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Unable to load wheel outcomes:", error);
      setOutcomes([]);
      toast.error("The prize wheel could not be loaded.");
    } else {
      setOutcomes(data ?? []);
    }

    setLoadingPrizes(false);
  }

  async function loadUserStats() {
    setLoadingStats(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingStats(false);
      return;
    }

    const [profileResult, winsResult, paymentsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("remaining_spins,total_spins")
        .eq("id", user.id)
        .single(),
      supabase
        .from("wins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("payment_logs")
        .select("amount")
        .eq("user_id", user.id),
    ]);

    if (profileResult.error) {
      console.error("Unable to load profile:", profileResult.error);
      toast.error("Your spin balance could not be loaded.");
    } else {
      setRemainingSpins(profileResult.data.remaining_spins ?? 0);
      setTotalSpins(profileResult.data.total_spins ?? 0);
    }

    setTotalWins(winsResult.count ?? 0);

    const donated = (paymentsResult.data ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0
    );

    setTotalDonations(donated / 100);
    setLoadingStats(false);
  }

  function requestSpin() {
    if (spinning) return;

    if (loadingPrizes || loadingStats) {
      toast("Getting your wheel ready…");
      return;
    }

    if (outcomes.length === 0) {
      toast.error("No wheel outcomes are available right now.");
      return;
    }

    if (remainingSpins <= 0) {
      toast.error("You’re out of spins. Purchase another spin to continue.");
      return;
    }

    void spin();
  }

  async function spin() {
    if (!readyToSpin) return;

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
      stopSpinAudio();
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
      stopSpinAudio();
      toast.error("Could not connect. Your spin was not used.");
      setSpinning(false);
      return;
    }

    const data = (await response.json()) as SpinResponse;

    if (!response.ok || !data.success || data.outcomeId === undefined) {
      stopSpinAudio();
      toast.error(data.error ?? "Unable to spin right now.");
      setSpinning(false);
      return;
    }

    const index = outcomes.findIndex(
      (outcome) => outcome.id === data.outcomeId
    );

    if (index === -1) {
      stopSpinAudio();
      toast.error("The wheel changed. Please try again.");
      await loadOutcomes();
      setSpinning(false);
      return;
    }

    const sliceAngle = 360 / outcomes.length;
    const desiredAngle =
      360 - (index * sliceAngle + sliceAngle / 2);
    const currentAngle = ((rotation % 360) + 360) % 360;
    const landingOffset =
      ((desiredAngle - currentAngle) % 360 + 360) % 360;

    setRotation(rotation + 360 * 7 + landingOffset);
    setRemainingSpins(
      data.remainingSpins ?? Math.max(remainingSpins - 1, 0)
    );

    resultTimer.current = setTimeout(() => {
      stopSpinAudio();

      const won = Boolean(data.won);
      const resultLabel =
        data.winner?.prize?.name ??
        data.outcomeLabel ??
        "Try Again";

      if (won && winSound.current) {
        winSound.current.currentTime = 0;
        void winSound.current.play().catch(() => undefined);
      }

      setWinner(resultLabel);
      setDidWin(won);
      setShowConfetti(won);
      setSpinning(false);
      void loadUserStats();

      if (won) {
        confettiTimer.current = setTimeout(
          () => setShowConfetti(false),
          4500
        );
      }
    }, SPIN_DURATION);
  }

  function stopSpinAudio() {
    if (!spinSound.current) return;
    spinSound.current.pause();
    spinSound.current.currentTime = 0;
  }

  function closeResult() {
    setWinner("");
    setShowConfetti(false);
  }

  const statusText = spinning
    ? "Revealing your result…"
    : loadingPrizes || loadingStats
      ? "Preparing your wheel…"
      : remainingSpins <= 0
        ? "Purchase a spin to play"
        : `${remainingSpins} ${remainingSpins === 1 ? "spin" : "spins"} ready`;

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden bg-[#071628]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-14rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[#2F6ED8]/16 blur-[110px]" />
          <div className="absolute bottom-[-14rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-[#C9A44D]/10 blur-[110px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5E9CF4]/35 to-transparent" />
        </div>

        {showConfetti && (
          <div className="pointer-events-none fixed inset-0 z-[70]">
            <Confetti
              width={typeof window === "undefined" ? 0 : window.innerWidth}
              height={typeof window === "undefined" ? 0 : window.innerHeight}
              recycle={false}
              numberOfPieces={320}
              colors={["#C9A44D", "#F5DE98", "#2F6ED8", "#5E9CF4", "#FFFFFF"]}
            />
          </div>
        )}

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-[#8DB9F4]">
                <Sparkles className="h-4 w-4 text-[#C9A44D]" />
                Spin4Chinuch
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                Spin to win
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-[#BFD2EB]">
                Your result is selected securely before the animation begins.
                The wheel simply makes the reveal worth watching.
              </p>
            </div>

            <Link
              href="/prizes"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-[#5E9CF4]/35 hover:bg-white/[0.1]"
            >
              View all prizes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Spins left",
                value: loadingStats ? "—" : remainingSpins,
                icon: Ticket,
                accent: true,
              },
              {
                label: "Total spins",
                value: loadingStats ? "—" : totalSpins,
                icon: CircleDashed,
              },
              {
                label: "Wins",
                value: loadingStats ? "—" : totalWins,
                icon: Trophy,
              },
              {
                label: "Donated",
                value: loadingStats
                  ? "—"
                  : `$${totalDonations.toLocaleString()}`,
                icon: DollarSign,
              },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  accent
                    ? "border-[#C9A44D]/35 bg-[#C9A44D]/[0.09]"
                    : "border-white/10 bg-white/[0.055]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8FA8C8]">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
                      {value}
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      accent
                        ? "bg-[#C9A44D]/15 text-[#E8CD7A]"
                        : "bg-[#2F6ED8]/15 text-[#8DB9F4]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section className="grid overflow-hidden rounded-[32px] border border-white/10 bg-[#0C1F38]/90 shadow-[0_28px_90px_rgba(0,0,0,.28)] backdrop-blur-xl lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
            <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden border-b border-white/10 p-5 sm:p-9 lg:min-h-[680px] lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(47,110,216,.13),transparent_58%)]" />

              {loadingPrizes ? (
                <div className="relative flex flex-col items-center text-center">
                  <div className="h-11 w-11 animate-spin rounded-full border-2 border-[#5E9CF4]/25 border-t-[#5E9CF4]" />
                  <p className="mt-4 font-semibold text-[#BFD2EB]">
                    Loading the prize wheel
                  </p>
                </div>
              ) : outcomes.length === 0 ? (
                <div className="relative max-w-sm text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.07] text-[#8DB9F4]">
                    <Gift className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-2xl font-black text-white">
                    The wheel is unavailable
                  </h2>
                  <p className="mt-2 text-[#9DB2CE]">
                    No active outcomes were found. Please check the wheel setup
                    in Supabase.
                  </p>
                </div>
              ) : (
                <div className="relative w-full">
                  <PrizeWheel
                    rotation={rotation}
                    spinning={spinning}
                    prizes={outcomes}
                    canSpin={!spinning}
                    onSpin={requestSpin}
                  />
                </div>
              )}
            </div>

            <aside className="flex flex-col justify-between p-6 sm:p-8 lg:p-9">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8DB9F4]">
                  Ready when you are
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white">
                  One click. One reveal.
                </h2>
                <p className="mt-3 leading-7 text-[#9DB2CE]">
                  Press the center of the wheel. Your spin is deducted only
                  after the server confirms the result.
                </p>

                <div className="mt-7 rounded-2xl border border-white/10 bg-[#071628]/55 p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        spinning
                          ? "animate-pulse bg-[#C9A44D]"
                          : readyToSpin
                            ? "bg-emerald-400"
                            : "bg-[#6D83A1]"
                      }`}
                    />
                    <p className="font-bold text-white">{statusText}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-[#8FA8C8]">
                    <ShieldCheck className="h-4 w-4 text-[#8DB9F4]" />
                    Result selected securely on the server
                  </div>
                </div>

                <div className="mt-7 space-y-4 text-sm text-[#BFD2EB]">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2F6ED8]/15 text-xs font-black text-[#8DB9F4]">
                      1
                    </span>
                    <p className="pt-1">Press the center button.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2F6ED8]/15 text-xs font-black text-[#8DB9F4]">
                      2
                    </span>
                    <p className="pt-1">Watch the wheel reveal your result.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2F6ED8]/15 text-xs font-black text-[#8DB9F4]">
                      3
                    </span>
                    <p className="pt-1">Wins are saved automatically.</p>
                  </div>
                </div>
              </div>

              {remainingSpins <= 0 && !loadingStats && (
                <Link
                  href="/buy-spins"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2F6ED8] to-[#5E9CF4] px-5 py-4 font-black text-white shadow-lg shadow-[#2F6ED8]/20 transition hover:-translate-y-0.5"
                >
                  Get spins
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </aside>
          </section>
        </div>

        {winner && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#020914]/80 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="spin-result-title"
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-[#0C1F38] shadow-[0_32px_100px_rgba(0,0,0,.55)]">
              <button
                type="button"
                onClick={closeResult}
                aria-label="Close result"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-[#BFD2EB] transition hover:bg-white/[0.12] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div
                className={`h-1.5 w-full ${
                  didWin
                    ? "bg-gradient-to-r from-[#A9822E] via-[#F5DE98] to-[#A9822E]"
                    : "bg-gradient-to-r from-[#234F91] via-[#5E9CF4] to-[#234F91]"
                }`}
              />

              <div className="p-8 text-center sm:p-10">
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                    didWin
                      ? "bg-[#C9A44D]/15 text-[#E8CD7A]"
                      : "bg-[#2F6ED8]/15 text-[#8DB9F4]"
                  }`}
                >
                  {didWin ? (
                    <Trophy className="h-8 w-8" />
                  ) : (
                    <Sparkles className="h-8 w-8" />
                  )}
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-[#8DB9F4]">
                  {didWin ? "Congratulations" : "Thank you for spinning"}
                </p>
                <h2
                  id="spin-result-title"
                  className="mt-3 text-4xl font-black tracking-[-0.04em] text-white"
                >
                  {didWin ? "You won" : "Not this time"}
                </h2>

                <div className="mt-7 rounded-2xl border border-white/10 bg-[#071628]/60 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#7F97B6]">
                    {didWin ? "Your prize" : "Your result"}
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {winner}
                  </p>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {remainingSpins > 0 ? (
                    <button
                      type="button"
                      onClick={closeResult}
                      className="rounded-2xl bg-gradient-to-r from-[#2F6ED8] to-[#5E9CF4] px-5 py-4 font-black text-white transition hover:-translate-y-0.5"
                    >
                      Spin again
                    </button>
                  ) : (
                    <Link
                      href="/buy-spins"
                      className="rounded-2xl bg-gradient-to-r from-[#2F6ED8] to-[#5E9CF4] px-5 py-4 font-black text-white transition hover:-translate-y-0.5"
                    >
                      Get more spins
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 font-black text-white transition hover:bg-white/[0.09]"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <audio ref={spinSound} src="/sounds/spin.mp3" preload="auto" />
        <audio ref={winSound} src="/sounds/win.mp3" preload="auto" />
      </div>
    </ProtectedRoute>
  );
}
