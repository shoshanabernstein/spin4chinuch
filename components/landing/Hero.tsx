"use client";

import Button from "@/components/ui/Button";
import Link from "next/link";
import HeroWheel from "./HeroWheel";
import {
  ArrowRight,
  Gift,
  HeartHandshake,
} from "lucide-react";

export default function Hero() {
  return (
    <section data-landing="hero" className="relative overflow-hidden bg-gradient-to-br from-[#0D203B] via-[#19365F] to-[#284C82]">

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

<div className="relative mx-auto grid site-width items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:min-h-[620px] lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-10 lg:py-24">


        {/* LEFT */}
        <div className="w-full min-w-0 max-w-2xl">

          <h1 className="text-5xl font-black leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            <span className="block">Take a Spin.</span>
            <span className="mt-2 block text-[#F0D47F]">Win a Prize.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Support Jewish education while entering for incredible prize
            drawings.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">

            <Button href="/spin" variant="gold">
              Spin
            </Button>

            <a
              href="#about"
              className="flex items-center gap-2 font-semibold text-white transition hover:text-[#E7C96D]"
            >
              Learn More
              <ArrowRight size={18} />
            </a>

          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-4 border-t border-white/15 pt-6 text-sm">

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
              <Link
                href="/prizes"
                className="rounded-sm text-white transition hover:text-[#E7C96D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E7C96D]"
              >
                Premium Prizes
              </Link>
            </div>

          </div>

        </div>

        <HeroWheel />

      </div>
    </section>
  );
}
