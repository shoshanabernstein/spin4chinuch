"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PrizeWheel from "@/components/PrizeWheel/PrizeWheel";
import { supabase } from "@/lib/supabase";
import Confetti from "react-confetti";
import { useRef } from "react";
import Navbar from "@/components/Navbar";


export default function SpinPage() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState("");
  const [prizes, setPrizes] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
    loadPrizes();
  }, []);

  async function loadPrizes() {
    const { data } = await supabase
      .from("prizes")
      .select("*")
      .eq("active", true)
      .gt("quantity", 0);

    setPrizes(data || []);
  }

  async function spin() {

    if (spinning) return;


    setSpinning(true);
    setWinner("");


    if (spinSound.current) {
      spinSound.current.currentTime = 0;
      spinSound.current.play();
    }
    spinSound.current?.play();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in.");
      setSpinning(false);
      return;
    }

    const res = await fetch("/api/spin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error);
      setSpinning(false);
      return;
    }

    // Random visual stop.
    // The backend has already determined the winner.


    const index = prizes.findIndex(
      (p) => p.id === data.prizeId
    );

    const sliceAngle = 360 / prizes.length;

    const targetRotation =
      rotation +
      360 * 8 +
      (360 - index * sliceAngle - sliceAngle / 2);

    setRotation(targetRotation);


    setTimeout(() => {

      if (spinSound.current) {
        spinSound.current.pause();
        spinSound.current.currentTime = 0;
      }

      if (winSound.current) {
        winSound.current.currentTime = 0;
        winSound.current.play();
      }

      setWinner(data.prize);
      setShowConfetti(true);
      setSpinning(false);

      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }, 6000);
  }

return (
  <>
    <Navbar />

    <main className="min-h-screen pt-24 bg-[radial-gradient(circle_at_center,#1E3A8A_0%,#0F172A_60%,#020617_100%)] flex items-center justify-center overflow-hidden">

      {showConfetti && (
        <Confetti recycle={false} numberOfPieces={400} />
      )}

      <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col items-center">

        <h1 className="text-7xl font-black text-center text-white">
          Spin to Win
        </h1>

        <p className="text-yellow-300 text-2xl mt-5 text-center">
          Every Spin Supports Jewish Education
        </p>

        <div className="mt-10 flex justify-center">
          <PrizeWheel
            rotation={rotation}
            spinning={spinning}
            prizes={prizes}
          />
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className="
            mt-14
            px-16
            py-6
            rounded-2xl
            text-3xl
            font-black
            bg-gradient-to-r
            from-yellow-400
            to-yellow-600
            text-[#142A52]
            shadow-[0_0_40px_rgba(255,215,0,.6)]
            hover:scale-105
            hover:shadow-[0_0_70px_rgba(255,215,0,.8)]
            transition
            disabled:opacity-50
          "
        >
          {spinning ? "SPINNING..." : "SPIN THE WHEEL"}
        </button>

        {winner && (
          <div className="mt-14 bg-white/10 backdrop-blur-xl border border-yellow-400 rounded-3xl px-12 py-10 shadow-2xl text-center animate-pulse">

            <h2 className="text-5xl font-black text-yellow-300">
              🎉 Congratulations!
            </h2>

            <p className="mt-6 text-3xl font-bold">
              You won:
            </p>

            <p className="mt-4 text-5xl font-black text-yellow-400">
              {winner}
            </p>

            <Link
              href="/dashboard"
              className="inline-block mt-8 bg-yellow-400 text-[#142A52] font-bold px-8 py-4 rounded-xl hover:scale-105 transition"
            >
              Return to Dashboard
            </Link>

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
  );
}