"use client";

import LandingCard from "./LandingCard";
import { useAuth } from "@/components/AuthProvider";
import {
  Ticket,
  CircleDashed,
  Trophy,
  HeartHandshake,
} from "lucide-react";

export default function HowItWorks() {
  const { user } = useAuth();
  return (
    <section data-landing="steps" className="mx-auto site-width px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
      {/* Section Header */}
      <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
        <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[#4267A8]">
          How It Works
        </span>

        <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-[#142A52] sm:text-4xl">
          Four Simple Steps
        </h2>

      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LandingCard
          title="1. Buy Spins"
          href="/buy-spins"
          description="Purchase one or more spins to support Chinuch Yehudi and enter the fundraiser."
          icon={<Ticket size={30} />}
        />

        <LandingCard
          title="2. Spin the Wheel"
          href={user ? "/spin" : "/buy-spins"}
          description="Use your spins for a chance to instantly win exciting prizes donated by our sponsors."
          icon={<CircleDashed size={30} />}
        />

        <LandingCard
          title="3. Win Prizes"
          href="/prizes"
          description="If the wheel lands on a winning space, your win is saved and our team coordinates prize delivery."
          icon={<Trophy size={30} />}
        />

        <LandingCard
          title="4. Make an Impact"
          href="#about"
          description="Every spin helps strengthen Jewish education and supports the Chinuch Yehudi community."
          icon={<HeartHandshake size={30} />}
        />
      </div>
    </section>
  );
}
