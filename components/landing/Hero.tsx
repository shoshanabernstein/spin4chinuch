"use client";

import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-[#142A52] via-[#28457B] to-[#4267A8] px-8 py-24 text-white shadow-2xl">

      {/* Background Glow */}
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#80A8F7]/20 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#C9A44D]/20 blur-3xl" />

      {/* Wheel Watermark */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-[url('/wheel-watermark.png')] bg-contain bg-right bg-no-repeat opacity-10"
      />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start gap-8 lg:w-1/2">

        <span className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold tracking-widest backdrop-blur">
          SUPPORT CHINUCH YEHUDI
        </span>

        <h1 className="text-5xl font-black leading-tight md:text-7xl">
          Spin.
          <br />
          Win.
          <br />
          Give Back.
        </h1>

        <p className="max-w-xl text-lg leading-8 text-blue-100">
          Every spin supports Jewish education while giving you the opportunity
          to win exciting prizes donated by our generous sponsors.
        </p>

        <div className="flex flex-wrap gap-4">

          <Button href="/buy-spins" variant="gold">
            Buy Spins
          </Button>

          <Button
            href="/spin"
            variant="secondary"
            className="border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
          >
            Spin Now
          </Button>

        </div>

        <div className="flex flex-wrap gap-10 pt-8">

          <div>
            <p className="text-4xl font-black">100%</p>
            <p className="text-blue-200">Supports Chinuch</p>
          </div>

          <div>
            <p className="text-4xl font-black">🎁</p>
            <p className="text-blue-200">Amazing Prizes</p>
          </div>

          <div>
            <p className="text-4xl font-black">❤️</p>
            <p className="text-blue-200">Community Impact</p>
          </div>

        </div>
      </div>
    </section>
  );
}