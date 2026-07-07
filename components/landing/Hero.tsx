"use client";

import Button from "@/components/ui/Button";
import {
  ArrowRight,
  Gift,
  HeartHandshake,
  Sparkles,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#142A52] via-[#28457C] to-[#4267A8]">

      {/* Background Glow */}
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-[450px] w-[450px] rounded-full bg-[#E7C96D]/10 blur-3xl" />

      {/* Wheel Watermark */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute
            right-[-220px]
            top-1/2
            h-[900px]
            w-[900px]
            -translate-y-1/2
            bg-[url('/wheel-watermark.png')]
            bg-contain
            bg-no-repeat
            opacity-[0.08]
          "
        />
      </div>

<div className="relative mx-auto flex max-w-7xl items-center justify-between gap-12 px-6 pt-12 pb-6 lg:pt-14 lg:pb-8">


        {/* LEFT */}
        <div className="max-w-2xl">

          <h1 className="text-5xl font-black leading-tight tracking-tight text-white lg:text-7xl">
            Spin.
            <br />
            Win.
            <br />
            Give Back.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Support Jewish education while entering for incredible prize
            drawings.
          </p>

          <div className="mt-10 flex items-center gap-6">

            <Button href="#Actions" variant="gold">
              Buy Spins
            </Button>

            <a
              href="#About"
              className="flex items-center gap-2 font-semibold text-white transition hover:text-[#E7C96D]"
            >
              Learn More
              <ArrowRight size={18} />
            </a>

          </div>

          <div className="mt-10 flex flex-wrap gap-8">

            <div className="flex items-center gap-3">
              <HeartHandshake
                className="text-[#E7C96D]"
                size={22}
              />
              <span className="text-white">
                Supporting Chinuch
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Gift
                className="text-[#E7C96D]"
                size={22}
              />
              <span className="text-white">
                Premium Prizes
              </span>
            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="relative hidden h-[360px] w-[420px] lg:block">

          {/* Floating Card */}
          <div className="absolute right-0 top-8 w-80 rounded-3xl border border-white/10 bg-white/10 p-7 shadow-2xl backdrop-blur-xl">

            <div className="flex items-center gap-4">

              <div className="rounded-2xl bg-[#E7C96D]/20 p-3">
                <Gift
                  size={28}
                  className="text-[#E7C96D]"
                />
              </div>

              <div>

                <h3 className="text-xl font-bold text-white">
                  Amazing Prizes
                </h3>

                <p className="mt-1 text-sm text-blue-100">
                  Every spin gives you another opportunity to win.
                </p>

              </div>

            </div>

          </div>

          {/* Second Card */}
          <div className="absolute bottom-10 left-0 w-72 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">

            <div className="flex items-center gap-3">

              <HeartHandshake
                size={26}
                className="text-[#E7C96D]"
              />

              <div>

                <p className="font-semibold text-white">
                  Every Spin Matters
                </p>

                <p className="text-sm text-blue-100">
                  Helping support Chinuch Yehudi.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}