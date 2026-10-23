"use client";

import Link from "next/link";
import {
  Ticket,
  CircleDashed,
} from "lucide-react";

export default function Actions() {
  return (
    <section id="actions" className="mx-auto site-width scroll-mt-28 px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[#4267A8]">
          Get Started
        </span>

        <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-[#142A52] sm:text-4xl">
          Ready to Spin?
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Buy Spins */}
        <Link href="/buy-spins" className="group relative overflow-hidden rounded-[32px] border border-blue-100 bg-white p-6 sm:p-8 shadow-lg transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4267A8]">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#80A8F7]/20 blur-3xl" />

          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#4267A8] to-[#80A8F7] text-white shadow-lg">
              <Ticket size={28} />
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#142A52]">
              Buy Spins
            </h3>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Purchase spins to support Chinuch Yehudi and increase your chances
              of winning amazing prizes.
            </p>

            <div className="mt-6">
              <span className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#C9A44D] to-[#E7C96D] px-6 py-3 font-bold text-[#142A52] shadow-md">
                Buy Spins
              </span>
            </div>
          </div>
        </Link>

        {/* Spin */}
        <Link href="/spin" className="group relative overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-[#142A52] via-[#28457B] to-[#4267A8] p-6 sm:p-8 text-white shadow-lg transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4267A8]">
          <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-[#C9A44D]/20 blur-3xl" />

          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
              <CircleDashed size={28} />
            </div>

            <h3 className="mt-5 text-2xl font-black">
              Spin the Wheel
            </h3>

            <p className="mt-3 text-base leading-7 text-blue-100">
              Already have spins? Head straight to the wheel and see if you&apos;re
              today&apos;s next winner.
            </p>

            <div className="mt-6">
              <span
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 font-bold text-white shadow-md group-hover:bg-white/20"
              >
                Spin Now
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
