"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  Ticket,
  CircleDashed,
} from "lucide-react";

export default function Actions() {
  const { user } = useAuth();
  return (
    <section id="actions" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-24">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[#4267A8]">
          Get Started
        </span>

        <h2 className="mt-6 text-4xl font-black text-[#142A52] md:text-5xl">
          Ready to Spin?
        </h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Buy Spins */}
        <Link href="/buy-spins" className="group relative overflow-hidden rounded-[32px] border border-blue-100 bg-white p-10 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4267A8]">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#80A8F7]/20 blur-3xl" />

          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#4267A8] to-[#80A8F7] text-white shadow-lg">
              <Ticket size={40} />
            </div>

            <h3 className="mt-8 text-3xl font-black text-[#142A52]">
              Buy Spins
            </h3>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              Purchase spins to support Chinuch Yehudi and increase your chances
              of winning amazing prizes.
            </p>

            <div className="mt-10">
              <span className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#C9A44D] to-[#E7C96D] px-6 py-3 font-bold text-[#142A52] shadow-md">
                Buy Spins
              </span>
            </div>
          </div>
        </Link>

        {/* Spin */}
        <Link href={user ? "/spin" : "/login?redirect=/spin"} className="group relative overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-[#142A52] via-[#28457B] to-[#4267A8] p-10 text-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4267A8]">
          <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-[#C9A44D]/20 blur-3xl" />

          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
              <CircleDashed size={40} />
            </div>

            <h3 className="mt-8 text-3xl font-black">
              Spin the Wheel
            </h3>

            <p className="mt-4 text-lg leading-8 text-blue-100">
              Already have spins? Head straight to the wheel and see if you&apos;re
              today&apos;s next winner.
            </p>

            <div className="mt-10">
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
