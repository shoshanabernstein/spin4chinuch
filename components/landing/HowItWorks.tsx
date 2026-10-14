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
    <section className="mx-auto max-w-7xl px-6 pt-12 pb-16">
      {/* Section Header */}
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[#4267A8]">
          How It Works
        </span>

        <h2 className="mt-6 text-4xl font-black text-[#142A52] md:text-5xl">
          Four Simple Steps
        </h2>

        <p className="mt-6 text-lg leading-8 text-slate-600">
          Supporting Chinuch has never been easier. Purchase spins, spin the
          wheel, win exciting prizes, and make a meaningful impact.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
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
