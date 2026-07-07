"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Gift } from "lucide-react";
import Panel from "@/components/ui/Panel";
import PrizeCard from "./PrizeCard";

export interface Prize {
  id: number;
  name: string;
  image_url: string | null;
  retail_value: number | null;
  sponsor_name: string | null;
}

interface PrizeCarouselProps {
  prizes: Prize[];
}

export default function PrizeCarousel({ prizes }: PrizeCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function scrollLeft() {
    containerRef.current?.scrollBy({
      left: -320,
      behavior: "smooth",
    });
  }

  function scrollRight() {
    containerRef.current?.scrollBy({
      left: 320,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const el = containerRef.current;

    if (!el || prizes.length === 0) return;

    const interval = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 320, behavior: "smooth" });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [prizes]);

  if (prizes.length === 0) {
    return (
      <Panel title="Prizes" subtitle="New prizes will be added soon.">
        <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Gift className="mx-auto text-slate-400" size={56} />

          <h3 className="mt-5 text-2xl font-bold text-[#142A52]">
            No prizes available
          </h3>

          <p className="mt-2 text-slate-500">
            Check back soon for exciting prizes.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="" subtitle="">
      <div className="space-y-4">

        {/* Header row */}
        <div className="flex items-start justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#142A52]">
            Prizes
          </h2>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={scrollLeft}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={scrollRight}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={containerRef}
          className="
            flex
            gap-6
            overflow-x-auto
            scroll-smooth
            snap-x
            snap-mandatory
            pb-2
            [&::-webkit-scrollbar]:hidden
          "
        >
          {prizes.map((prize) => (
            <div key={prize.id} className="snap-start">
              <PrizeCard
                name={prize.name}
                imageUrl={prize.image_url || "/placeholder-prize.png"}
                retailValue={prize.retail_value}
                sponsorName={prize.sponsor_name}
              />
            </div>
          ))}
        </div>

      </div>
    </Panel>
  );
}