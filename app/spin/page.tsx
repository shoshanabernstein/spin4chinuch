"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PrizeWheel from "@/components/PrizeWheel/PrizeWheel";
import { supabase } from "@/lib/supabase";
import Confetti from "react-confetti";
import Navbar from "@/components/Navbar";

type Prize = {
  id: string;
  name: string;
  quantity: number;
  active: boolean;
};

export default function SpinPage() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState("");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadPrizes();
  }, []);

  async function loadPrizes() {
    setLoadingPrizes(true);

    const { data, error } = await supabase
      .from("prizes")
      .select("id, name, quantity, active")
      .eq("active", true)
      .gt("quantity", 0)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setPrizes([]);
    } else {
      setPrizes(data || []);
    }

    setLoadingPrizes(false);
  }

  async function spin() {
    if (spinning || loadingPrizes) return;

    if (prizes.length === 0) {
      alert("No prizes are available right now.");
      return;
    }

    setSpinning(true);
    setWinner("");

    if (spinSound.current) {
      spinSound.current.currentTime = 0;
      spinSound.current.play().catch(() => {});
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!user || !session) {
      alert("Please log in.");
      setSpinning(false);
      return;
    }

    const res = await fetch("/api/spin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error);
      setSpinning(false);
      return;
    }

    const index = prizes.findIndex((p) => p.id === data.prizeId);

    if (index < 0) {
      alert("The prize list changed. Please try again.");
      await loadPrizes();
      setSpinning(false);
      return;
    }

    const sliceAngle = 360 / prizes.length;
    const targetRotation =
      rotation + 360 * 8 + (360 - index * sliceAngle - sliceAngle / 2);

    setRotation(targetRotation);

    setTimeout(() => {
      if (spinSound.current) {
        spinSound.current.pause();
        spinSound.current.currentTime = 0;
      }

      if (winSound.current) {
        winSound.current.currentTime = 0;
        winSound.current.play().catch(() => {});
      }

      setWinner(data.prize);
      setShowConfetti(true);
      setSpinning(false);
      loadPrizes();

      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }, 9000);
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-24 cy-dark-page flex items-center justify-center overflow-hidden">
        {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}

        <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-black text-center text-white">
            Spin to Win
          </h1>

          <p className="text-[#8fe5ef] text-xl md:text-2xl mt-5 text-center">
            Every spin supports Jewish education
          </p>

          <div className="mt-10 flex justify-center">
            <PrizeWheel rotation={rotation} spinning={spinning} prizes={prizes} />
          </div>

          <button
            onClick={spin}
            disabled={spinning || loadingPrizes || prizes.length === 0}
            className="mt-14 px-8 md:px-16 py-5 md:py-6 rounded-2xl text-2xl md:text-3xl font-black bg-gradient-to-r from-[#d6a84f] to-[#16a6b8] text-white shadow-[0_0_40px_rgba(15,141,179,.45)] hover:scale-105 hover:shadow-[0_0_70px_rgba(214,168,79,.35)] transition disabled:opacity-50 disabled:hover:scale-100"
          >
            {loadingPrizes ? "LOADING PRIZES..." : spinning ? "SPINNING..." : "SPIN THE WHEEL"}
          </button>

          {!loadingPrizes && prizes.length === 0 && (
            <p className="mt-6 max-w-xl text-center text-[#dff5f8]">
              Prizes are being restocked. Please check back soon.
            </p>
          )}

          {winner && (
            <div className="mt-14 bg-white/10 backdrop-blur-xl border border-[#d6a84f] rounded-3xl px-8 md:px-12 py-10 shadow-2xl text-center animate-pulse text-white">
              <h2 className="text-4xl md:text-5xl font-black text-[#8fe5ef]">
                Congratulations!
              </h2>

              <p className="mt-6 text-2xl md:text-3xl font-bold">You won:</p>

              <p className="mt-4 text-4xl md:text-5xl font-black text-[#d6a84f]">
                {winner}
              </p>

              <Link
                href="/dashboard"
                className="inline-block mt-8 bg-[#d6a84f] text-[#12304a] font-bold px-8 py-4 rounded-xl hover:scale-105 transition"
              >
                Return to Dashboard
              </Link>
            </div>
          )}
        </div>

        <audio ref={spinSound} src="/sounds/spin.mp3" preload="auto" />
        <audio ref={winSound} src="/sounds/win.mp3" preload="auto" />
      </main>
    </>
  );
}
