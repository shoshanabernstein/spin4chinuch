"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SOLD_OUT_MESSAGE } from "@/lib/spin-sales";
import { useRouter } from "next/navigation";
import { useSpinAvailability } from "@/components/useSpinAvailability";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import {
  DollarSign,
  Gift,
  Ticket,
  Trophy,
  X,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import PrizeWheel from "@/components/PrizeWheel/PrizeWheel";
import { supabase } from "@/lib/supabase";

type Outcome = {
  id: number;
  label: string;
  prize_id: number | null;
  sponsor_name?: string | null;
};

type SpinResponse = {
  success?: boolean;
  error?: string;
  outcomeId?: number;
  outcomeLabel?: string;
  remainingSpins?: number;
  won?: boolean;
  spinAgain?: boolean;
  winner?: {
    spinAgain?: boolean;
    prize?: {
      name?: string;
    } | null;
  };
};

export default function SpinPage() {
  const router = useRouter();
  const sales = useSpinAvailability();
  const { user, loading: loadingAuth } = useAuth();
  const inFlight = useRef(false);
  const [hasPendingSpin, setHasPendingSpin] = useState(false);
  const [rotation, setRotation] = useState(8);
  const [spinning, setSpinning] = useState(false);
  const [spinPhase, setSpinPhase] = useState<
    "idle" | "requesting" | "revealing"
  >("idle");
  const [winner, setWinner] = useState("");
  const [didWin, setDidWin] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const [remainingSpins, setRemainingSpins] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalWins, setTotalWins] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const actualRotation = useRef(8);
  const pendingResult = useRef<(() => void) | null>(null);
  const winSound = useRef<HTMLAudioElement>(null);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const [confettiSize, setConfettiSize] = useState({ width: 0, height: 0 });

  const readyToSpin =
    Boolean(user) &&
    !loadingAuth &&
    !spinning &&
    !loadingPrizes &&
    !loadingStats &&
    (remainingSpins > 0 || hasPendingSpin) &&
    (outcomes.length > 0 || hasPendingSpin);

  useEffect(() => {
    if (spinning || winner || loadingPrizes || outcomes.length === 0) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (!document.hidden && !reducedMotion.matches) {
        setRotation((current) => current + 0.5);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [spinning, winner, loadingPrizes, outcomes.length]);

  useEffect(() => {
    void Promise.all([loadOutcomes(), loadUserStats()]);

    return () => {
      pendingResult.current = null;
      void audioContext.current?.close();
      audioContext.current = null;
      if (confettiTimer.current) clearTimeout(confettiTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!winner || !resultCardRef.current) return;

    const card = resultCardRef.current;
    const updateSize = () => {
      setConfettiSize({ width: card.clientWidth, height: card.clientHeight });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(card);
    return () => observer.disconnect();
  }, [winner]);

  async function loadOutcomes() {
    setLoadingPrizes(true);

    try {
      const response = await fetch("/api/wheel-outcomes", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load wheel outcomes");
      const data = await response.json();
      setOutcomes(data.outcomes);
    } catch {
      setOutcomes([]);
      toast.error("The prize wheel could not be loaded.");
    } finally {
      setLoadingPrizes(false);
    }
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

    try {
      setHasPendingSpin(Boolean(localStorage.getItem(`pending-spin/${user.id}`)));
    } catch { /* Storage availability is checked before submitting a spin. */ }

    const [profileResult, winsResult, paymentsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("remaining_spins")
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

    if (outcomes.length === 0 && !hasPendingSpin) {
      toast.error("No wheel outcomes are available right now.");
      return;
    }

    if (remainingSpins <= 0 && !hasPendingSpin) {
      toast.error("You’re out of spins. Purchase another spin to continue.");
      return;
    }

    try {
      audioContext.current ??= new AudioContext();
      void audioContext.current.resume().catch(() => undefined);
    } catch { /* A blocked audio device must not prevent a spin. */ }
    void spin();
  }

  async function spin() {
    if (!readyToSpin || inFlight.current) return;
    inFlight.current = true;

    setSpinning(true);
    setSpinPhase("requesting");
    setWinner("");
    setDidWin(false);
    setShowConfetti(false);
    const preSpinRotation = actualRotation.current + 360 * 5;
    setRotation(preSpinRotation);

    // Let the browser paint the first movement before session/network work.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      stopSpinFeedback();
      toast.error("Your session expired. Please log in again.");
      inFlight.current = false;
      setSpinning(false);
      setSpinPhase("idle");
      return;
    }

    let response: Response;
    let data: SpinResponse;
    const storageKey = `pending-spin/${session.user.id}`;

    try {
      const requestId = localStorage.getItem(storageKey) ?? crypto.randomUUID();
      localStorage.setItem(storageKey, requestId);
      setHasPendingSpin(true);
      response = await fetch("/api/spin", {
        method: "POST",
        body: JSON.stringify({ requestId }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      data = (await response.json()) as SpinResponse;
    } catch {
      stopSpinFeedback();
      toast.error("Could not confirm your spin. Try again to recover the same result.");
      inFlight.current = false;
      setSpinning(false);
      setSpinPhase("idle");
      return;
    }

    if (!response.ok || !data.success || data.outcomeId === undefined) {
      stopSpinFeedback();
      toast.error(data.error ?? "Unable to spin right now.");
      inFlight.current = false;
      setSpinning(false);
      setSpinPhase("idle");
      return;
    }

    const index = outcomes.findIndex(
      (outcome) => outcome.id === data.outcomeId
    );

    if (index === -1) {
      // A replay can refer to a prize that is now sold out or archived.
      stopSpinFeedback();
      setWinner(data.winner?.prize?.name ?? data.outcomeLabel ?? "Better luck next time");
      setDidWin(Boolean(data.won));
      try { localStorage.removeItem(storageKey); } catch { /* Replaying is safe. */ }
      setHasPendingSpin(false);
      inFlight.current = false;
      setSpinning(false);
      setSpinPhase("idle");
      void loadUserStats();
      return;
    }

    const sliceAngle = 360 / outcomes.length;
    const desiredAngle =
      90 - (index * sliceAngle + sliceAngle / 2);
    const landingStart = actualRotation.current;
    const currentAngle = ((landingStart % 360) + 360) % 360;
    const landingOffset =
      ((desiredAngle - currentAngle) % 360 + 360) % 360;

    setSpinPhase("revealing");
    setRotation(landingStart + 360 * 5 + landingOffset);
    setRemainingSpins(
      data.remainingSpins ?? Math.max(remainingSpins - 1, 0)
    );

    pendingResult.current = () => {
      try { localStorage.removeItem(storageKey); } catch { /* Replaying is safe. */ }
      setHasPendingSpin(false);
      stopSpinFeedback();

      const won = Boolean(data.won);
      const spinAgain = Boolean(data.spinAgain ?? data.winner?.spinAgain);
      const resultLabel = !won && !spinAgain
        ? "Better luck next time"
        : data.winner?.prize?.name ?? data.outcomeLabel ?? "Better luck next time";

      if (won && winSound.current) {
        winSound.current.currentTime = 0;
        void winSound.current.play().catch(() => undefined);
      }

      setWinner(resultLabel);
      setDidWin(won);
      setShowConfetti(won);
      inFlight.current = false;
      setSpinning(false);
      setSpinPhase("idle");
      void loadUserStats();

      if (won) {
        confettiTimer.current = setTimeout(
          () => setShowConfetti(false),
          4500
        );
      }

      if (spinAgain) {
        toast.success("Spin again — this spin was returned to your balance.");
      }
    };
  }

  function stopSpinFeedback() {
    setRotation(actualRotation.current);
    pendingResult.current = null;
  }

  function playWheelTick() {
    const context = audioContext.current;
    if (!context || context.state !== "running") return;
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(1600, start);
    oscillator.frequency.exponentialRampToValueAtTime(500, start + 0.014);
    gain.gain.setValueAtTime(0.035, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.018);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + 0.02);
  }

  function closeResult() {
    setWinner("");
    setShowConfetti(false);
  }

  async function buySpins(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const remaining = await sales.check();
    if (remaining === null) toast.error("Unable to check availability. Please try again.");
    else if (remaining === 0) toast(SOLD_OUT_MESSAGE);
    else router.push("/buy-spins");
  }

  return (
    <>
      <div className="relative h-[calc(100dvh-5rem)] overflow-hidden bg-[#071628] sm:h-[calc(100dvh-6rem)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,#0C1C32_0%,#09182C_45%,#061222_80%)]" />
          <div className="absolute left-1/2 top-28 h-[min(110vw,900px)] w-[min(110vw,900px)] -translate-x-1/2 rounded-full border border-[#8DB9F4]/[0.08] bg-[conic-gradient(from_20deg,transparent,rgba(94,156,244,.08),transparent_35%,rgba(216,179,79,.06),transparent_75%)]" />
          <div className="absolute left-1/2 top-36 h-[min(95vw,800px)] w-[min(95vw,800px)] -translate-x-1/2 rounded-full border border-[#D8B34F]/[0.07]" />
          <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-[#2F6ED8]/10 blur-[100px]" />
          <div className="absolute -right-40 top-1/2 h-96 w-96 rounded-full bg-[#C9A44D]/[0.08] blur-[100px]" />
          <div className="absolute -left-56 top-16 h-[640px] w-[640px] -rotate-[25deg] rounded-full border-[55px] border-[#527FD1]/[0.04]" />
          <div className="absolute -right-64 top-[420px] h-[700px] w-[700px] rounded-full border-[70px] border-[#D8B34F]/[0.035]" />
          <div className="absolute -left-32 top-52 h-24 w-[55%] -rotate-[35deg] bg-gradient-to-r from-transparent via-[#477FDA]/[0.12] to-transparent blur-3xl" />
          <div className="absolute -right-32 top-96 h-24 w-[50%] -rotate-[35deg] bg-gradient-to-r from-transparent via-[#D8B34F]/[0.08] to-transparent blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(141,185,244,.18)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_right,black,transparent_28%,transparent_72%,black)]" />
          <span className="absolute left-[8%] top-[20%] h-3 w-3 rotate-[25deg] rounded-sm border border-[#D8B34F]/30" />
          <span className="absolute right-[10%] top-[32%] h-2 w-2 rounded-full bg-[#8DB9F4]/30" />
          <span className="absolute bottom-[18%] left-[14%] h-2 w-2 rounded-full bg-[#D8B34F]/30" />
        </div>

        <div className="relative mx-auto flex h-full w-full flex-col justify-center px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <h1 className="sr-only">Spin the prize wheel</h1>


          <section className="relative mx-auto flex w-full flex-col items-center xl:grid xl:grid-cols-[minmax(240px,1fr)_minmax(0,min(1100px,calc(100dvh-136px)))_minmax(240px,1fr)] xl:gap-10 2xl:gap-14">
            <div className="relative flex w-full min-w-0 flex-col items-center justify-center px-0 pb-3 sm:px-6 sm:pb-4 xl:col-start-2 xl:px-0 xl:pb-0">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,.4),transparent_65%)]" />

              {loadingPrizes ? (
                <div className="relative flex h-[min(320px,calc(100dvh-240px))] flex-col items-center justify-center text-center sm:h-[min(480px,calc(100dvh-256px))]">
                  <div className="h-11 w-11 animate-spin rounded-full border-2 border-[#5E9CF4]/25 border-t-[#5E9CF4]" />
                  <p className="mt-4 font-semibold text-[#BFD2EB]">
                    Loading the prize wheel
                  </p>
                </div>
              ) : outcomes.length === 0 ? (
                <div className="relative flex h-[min(320px,calc(100dvh-240px))] max-w-sm flex-col items-center justify-center px-4 text-center sm:h-[min(480px,calc(100dvh-256px))]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.07] text-[#8DB9F4]">
                    <Gift className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-2xl font-black text-white">
                    The wheel is unavailable
                  </h2>
                  <p className="mt-2 text-[#9DB2CE]">
                    Please check back shortly or explore the available prizes.
                  </p>
                </div>
              ) : (
                <div className="relative isolate mx-auto w-full max-w-[calc(100dvh-216px)] sm:max-w-[calc(100dvh-232px)] xl:max-w-[calc(100dvh-136px)] drop-shadow-[0_24px_36px_rgba(0,0,0,.65)]">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-[3%] -z-10 rounded-full shadow-[0_0_0_2px_rgba(240,212,127,.35),0_0_28px_6px_rgba(216,179,79,.2),0_0_70px_16px_rgba(94,156,244,.12)]" />
                  <PrizeWheel
                    rotation={rotation}
                    spinning={spinning}
                    spinPhase={spinPhase}
                    prizes={outcomes}
                    canSpin={readyToSpin}
                    purchaseBlockedLabel={sales.remaining === 0 ? "Sold out" : sales.remaining === null ? (sales.unavailable ? "Sales unavailable" : "Checking availability…") : undefined}
                    onBuySpins={buySpins}
                    showBuySpins={!loadingAuth && !spinning && (!user || (!loadingStats && remainingSpins <= 0 && !hasPendingSpin))}
                    onSpin={requestSpin}
                    onRotationUpdate={(angle) => { actualRotation.current = angle; }}
                    onTick={playWheelTick}
                    onSpinComplete={() => {
                      const reveal = pendingResult.current;
                      pendingResult.current = null;
                      reveal?.();
                    }}
                  />
                </div>
              )}
              {outcomes.length > 0 && !loadingPrizes && <p role="status" className="relative mt-1 px-2 text-center text-xs sm:text-sm font-medium text-[#AFC3DD]">
                {sales.remaining === 0 ? SOLD_OUT_MESSAGE : loadingStats ? "Loading your spins..." : ""}
              </p>}
            </div>

            <aside aria-label="Spin statistics" className="flex w-full max-w-[640px] flex-col gap-3 px-1 sm:px-6 xl:col-start-3 xl:w-full xl:max-w-[260px] xl:justify-self-start xl:gap-4 xl:px-0">
              <dl className="grid grid-cols-3 overflow-hidden rounded-[24px] border border-[#E8CD7A]/25 bg-gradient-to-br from-[#203854]/95 via-[#142A44]/95 to-[#0D2038]/95 shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_16px_36px_rgba(0,0,0,.2)] xl:grid-cols-1">
              {[
                {
                  label: "Spins left",
                  value: loadingStats ? "—" : remainingSpins,
                  icon: Ticket,
                  accent: true,
                },
                {
                  label: "Wins",
                  value: loadingStats ? "—" : totalWins,
                  icon: Trophy,
                },
                {
                  label: "Donated",
                  value: loadingStats ? "—" : `$${totalDonations.toLocaleString()}`,
                  icon: DollarSign,
                },
              ].map(({ label, value, icon: Icon, accent }) => (
                <div
                  key={label}
                  className={`relative overflow-hidden px-3 py-3 sm:px-4 ${accent
                    ? "bg-gradient-to-br from-[#D8B34F]/[0.2] via-[#D8B34F]/[0.07] to-transparent xl:px-5 xl:py-6"
                    : "border-l border-white/[0.08] xl:border-l-0 xl:border-t xl:px-5 xl:py-4"
                  }`}
                >
                  {accent && <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[16px] border-[#F0D47F]/[0.045]" />
                    <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#F0D47F]/50 to-transparent" />
                  </div>}
                  <div className={`relative flex min-w-0 items-center justify-between gap-2 ${accent ? "" : "xl:gap-3"}`}>
                    <div className={`min-w-0 ${accent ? "" : "xl:flex xl:flex-1 xl:items-center xl:justify-between xl:gap-3"}`}>
                      <dt className={`whitespace-nowrap text-[10px] font-semibold tracking-wide ${accent ? "uppercase text-[#E5CC8A]" : "text-[#AFC1D9] xl:text-sm"}`}>{!accent && <Icon aria-hidden="true" className="mr-2 hidden h-3.5 w-3.5 text-[#8DB9F4] xl:inline-block" strokeWidth={1.7} />}{label}</dt>
                      <dd className={`mt-1 whitespace-nowrap font-bold leading-tight tracking-tight tabular-nums ${accent ? "bg-gradient-to-b from-[#FFF3C6] to-[#E5BF62] bg-clip-text text-2xl text-transparent xl:mt-2 xl:text-5xl" : "text-xl text-[#F0F5FC] xl:mt-0 xl:text-xl"}`}>{value}</dd>
                    </div>
                    {accent && <div aria-hidden="true" className="hidden h-11 w-11 -rotate-6 shrink-0 items-center justify-center rounded-2xl border border-[#F0D47F]/40 bg-gradient-to-br from-[#F5DE98] to-[#BD9438] text-[#17304D] shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_5px_14px_rgba(0,0,0,.15)] sm:flex">
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                    </div>}
                  </div>
                </div>
              ))}
              </dl>

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
            <div ref={resultCardRef} className="relative max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-[32px] border border-[#D8B34F]/25 bg-gradient-to-br from-[#1C3453] via-[#10243E] to-[#0A192D] shadow-[0_32px_100px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.1)]">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full border-[35px] border-[#8DB9F4]/[0.035]" />
                <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full border-[40px] border-[#D8B34F]/[0.04]" />
                <div className="absolute left-1/2 top-32 h-40 w-64 -translate-x-1/2 rounded-full bg-[#D8B34F]/[0.07] blur-3xl" />
              </div>
              {showConfetti && confettiSize.width > 0 && (
                <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
                  <Confetti
                    width={confettiSize.width}
                    height={confettiSize.height}
                    recycle={false}
                    numberOfPieces={180}
                    gravity={0.22}
                    initialVelocityY={18}
                    colors={["#C9A44D", "#F5DE98", "#2F6ED8", "#5E9CF4", "#FFFFFF"]}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={closeResult}
                aria-label="Close result"
                className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-[#BFD2EB] transition hover:bg-white/[0.12] hover:text-white"
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

              <div className="relative px-8 pb-6 pt-12 sm:px-10 sm:pb-7 sm:pt-12">
                <Image src="/navbar_logo.png" alt="Spin for Chinuch" width={700} height={170} className="mx-auto h-auto w-[360px] max-w-full" />
              </div>
              <div className="relative mx-6 border-t border-white/[0.08] pb-6 pt-6 text-center sm:mx-8 sm:pb-7 sm:pt-7">
                <div aria-hidden="true" className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-[#E8CD7A]/15" />
                  <div className="absolute -left-6 top-3 h-2 w-2 rotate-[25deg] rounded-sm bg-[#E8CD7A]/60" />
                  <div className="absolute -right-5 bottom-4 h-1.5 w-1.5 rounded-full bg-[#8DB9F4]/70" />
                  <div className={`relative flex h-12 w-12 items-center justify-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_8px_20px_rgba(0,0,0,.15)] ${didWin ? "border-[#F4DE97]/60 bg-gradient-to-br from-[#F6E3A2] to-[#BF9636] text-[#203149]" : "border-[#8DB9F4]/30 bg-gradient-to-br from-[#34567F] to-[#1B3555] text-[#D5E5FB]"}`}>
                    {didWin ? <Trophy className="h-6 w-6" strokeWidth={1.5} /> : <Gift className="h-6 w-6" strokeWidth={1.5} />}
                  </div>
                </div>
                <h2 id="spin-result-title" className={`mx-auto max-w-sm text-balance text-3xl font-black leading-[1.15] tracking-[-0.035em] sm:text-4xl ${didWin ? "bg-gradient-to-r from-[#FFF1BD] to-[#E0BB57] bg-clip-text text-transparent" : "text-white"}`}>
                  {didWin ? "You won!" : winner}
                </h2>
                {didWin && <p className="mt-3 text-sm leading-6 text-[#A4BAD5]">Congratulations!</p>}
                {didWin && <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#E8CD7A]/25 bg-gradient-to-br from-[#E8CD7A]/[0.09] to-[#E8CD7A]/[0.02] px-5 py-6">
                  <div aria-hidden="true" className="absolute -right-5 -top-5 h-20 w-20 rounded-full border-[12px] border-[#E8CD7A]/[0.06]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B9B18D]">Your prize</p>
                  <p className="relative mt-2 break-words text-xl font-bold leading-snug tracking-[-0.02em] text-[#F2DE9F] sm:text-2xl">{winner}</p>
                </div>}

                <div className="mt-6 flex flex-col gap-2">
                  {remainingSpins > 0 ? (
                    <button
                      type="button"
                      onClick={closeResult}
                      className="flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#D8B34F] to-[#F3D77E] px-3 py-3 text-sm font-bold text-[#102743] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_5px_16px_rgba(216,179,79,.12)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F0D47F]"
                    >
                      Spin again
                    </button>
                  ) : (
                    <Link
                      href="/buy-spins"
                      onClick={buySpins}
                      aria-disabled={sales.remaining === 0}
                      className="flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#D8B34F] to-[#F3D77E] px-3 py-3 text-sm font-bold text-[#102743] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_5px_16px_rgba(216,179,79,.12)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F0D47F]"
                    >
                      {sales.remaining === 0 ? "Sold out" : "Buy spins"}
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    className="mx-auto inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-[#A4BAD5] underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8DB9F4]"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <audio ref={winSound} src="/sounds/win.mp3" preload="auto" />
      </div>
    </>
  );
}
