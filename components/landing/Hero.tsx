"use client";

import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  ArrowRight,
  Gift,
  HeartHandshake,
} from "lucide-react";

export default function Hero() {
  const { user } = useAuth();
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

<div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl flex-col items-center justify-center gap-10 px-6 py-12 sm:min-h-[calc(100svh-6rem)] md:flex-row md:justify-between lg:gap-12 lg:py-16">


        {/* LEFT */}
        <div className="w-full min-w-0 max-w-2xl md:flex-1">

          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
            <span className="block">Take a Spin.</span>
            <span className="mt-3 block sm:mt-4">Win a Prize.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Support Jewish education while entering for incredible prize
            drawings.
          </p>

          <div className="mt-10 flex items-center gap-6">

            <Button href={user ? "/spin" : "/login?redirect=/spin"} variant="gold">
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
              <Link
                href="/prizes"
                className="rounded-sm text-white transition hover:text-[#E7C96D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E7C96D]"
              >
                Premium Prizes
              </Link>
            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="relative grid w-full max-w-[420px] shrink-0 gap-4 md:block md:h-[360px] md:w-[320px] lg:w-[420px]">

          {/* Floating Card */}
          <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-7 shadow-2xl backdrop-blur-xl md:absolute md:right-0 md:top-8 md:w-80">

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
          <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl md:absolute md:bottom-10 md:left-0 md:w-72">

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
