"use client";

import { useState } from "react";

const prizes = [
  "🎁 Free Spin",
  "💳 $5 Gift Card",
  "💳 $10 Gift Card",
  "🎉 $25 Gift Card",
  "🏆 $100 Gift Card",
];

export default function SpinPage() {
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);

  async function spinWheel() {
    setSpinning(true);
    setResult("");

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];

    setResult(prize);
    setSpinning(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-8">
      <div className="text-center">

        <h1 className="text-5xl font-bold mb-10">
          Spin The Wheel
        </h1>

        <div
          className={`w-72 h-72 rounded-full border-8 border-blue-600 flex items-center justify-center text-7xl bg-white shadow-2xl ${
            spinning ? "animate-spin" : ""
          }`}
        >
          🎡
        </div>

        <button
          onClick={spinWheel}
          disabled={spinning}
          className="mt-10 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-xl font-bold disabled:bg-gray-400"
        >
          {spinning ? "Spinning..." : "SPIN"}
        </button>

        {result && (
          <div className="mt-10 bg-green-100 border border-green-300 rounded-2xl p-6">
            <p className="text-3xl font-bold text-green-700">
              You Won!
            </p>

            <p className="text-2xl mt-2">
              {result}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}