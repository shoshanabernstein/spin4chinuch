"use client";

import Button from "@/components/ui/Button";
import { CreditCard, Ticket } from "lucide-react";

export default function BuySpinsHero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-lg">

      {/* Wheel Watermark */}
      <div
        className="absolute right-[-60px] top-0 h-full w-[55%] bg-contain bg-right bg-no-repeat opacity-[0.05]"
        style={{
          backgroundImage: "url('/wheel-watermark.svg')",
        }}
      />

      {/* Glow */}
      <div className="absolute -right-20 -top-20 h-50 w-72 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1.6fr_300px] p-6 lg:p-7">

        {/* LEFT */}
        <div className="flex flex-col justify-center">

          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#4267A8]">
            Spin • Support • Win
          </p>

          <div className="mt-3 h-1 w-20 rounded-full bg-[#C9A44D]" />

          <h1 className="mt-5 text-5xl lg:text-6xl font-black leading-none text-[#142A52]">
            Buy Spins
          </h1>

          <p className="mt-4 max-w-md text-lg text-slate-600">
            Purchase spins for your chance to win incredible prizes.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">

            <Button
              href="#purchase"
              variant="gold"
              className="px-8"
            >
              Buy Spins
            </Button>

            <Button
              href="#prizes"
              variant="secondary"
            >
              View Prizes
            </Button>

          </div>

        </div>


        {/* RIGHT */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#E7D7A4] bg-gradient-to-br from-[#FFFDF6] via-[#FFF8EA] to-[#FFF2CF] 7 shadow-lg">

          {/* Decorative Glows */}
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#F5D77B]/25 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-blue-100/40 blur-2xl" />

          {/* Decorative Ticket */}
          <div className="absolute bottom-4 right-4 opacity-10">
            <Ticket
              size={80}
              strokeWidth={1.5}
              className="text-[#C9A44D]"
            />
          </div>

          <div className="relative flex h-full flex-col items-center justify-center text-center">

            {/* Heading */}
            <div className="flex items-center gap-2">

              <Ticket
                size={16}
                className="text-[#C9A44D]"
              />

              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#B89032]">
                Price Per Spin
              </p>

            </div>

            {/* Price */}
            <div className="mt-4 text-6xl lg:text-7xl font-black leading-none text-[#142A52]">
              $18
            </div>

            {/* Divider */}
            <div className="mt-4 h-px w-20 bg-gradient-to-r from-transparent via-[#C9A44D] to-transparent" />

            {/* Subtitle */}
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Per Spin
            </p>

          </div>

        </div>
        </div>
    </section>
  );
}