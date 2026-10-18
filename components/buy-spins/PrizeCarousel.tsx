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
  quantity: number;
  original_quantity?: number | null;
  sponsor_name: string | null;
}

interface PrizeCarouselProps {
  prizes: Prize[];
}

export default function PrizeCarousel({ prizes }: PrizeCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeAtRef = useRef(0);

  function scrollLeft() {
    resumeAtRef.current = performance.now() + 3000;
    containerRef.current?.scrollBy({
      left: -334,
      behavior: "smooth",
    });
  }

  function scrollRight() {
    resumeAtRef.current = performance.now() + 3000;
    containerRef.current?.scrollBy({
      left: 334,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const el = containerRef.current;

    if (!el || prizes.length === 0) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number;
    let previousTime = 0;
    let position = el.scrollLeft;

    function animate(time: number) {
      const elapsed = previousTime ? Math.min(time - previousTime, 50) : 0;
      previousTime = time;
      const firstGroup = el!.firstElementChild as HTMLElement;
      const duplicate = firstGroup.nextElementSibling as HTMLElement;
      const overflowing = firstGroup.offsetWidth > el!.clientWidth;
      duplicate.style.display = overflowing ? "flex" : "none";

      if (!reducedMotion.matches && overflowing && !pausedRef.current && time >= resumeAtRef.current && !document.hidden) {
        // Keep fractional pixels so the speed is consistent on every display.
        position = (position + elapsed * 0.035) % firstGroup.offsetWidth;
        el!.scrollLeft = position;
      } else {
        position = el!.scrollLeft;
      }
      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
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
      <div className="space-y-4"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onFocusCapture={() => { pausedRef.current = true; }}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) pausedRef.current = false; }}
      >

        {/* Header row */}
        <div className="flex items-start justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#142A52]">
            Prizes
          </h2>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Show previous prizes"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={scrollRight}
              aria-label="Show next prizes"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={containerRef}
          onTouchStart={() => { pausedRef.current = true; }}
          onTouchEnd={() => { pausedRef.current = false; resumeAtRef.current = performance.now() + 3000; }}
          onTouchCancel={() => { pausedRef.current = false; }}
          onWheel={() => { resumeAtRef.current = performance.now() + 3000; }}
          className="
            flex
            overflow-x-auto
            pb-2
            [&::-webkit-scrollbar]:hidden
          "
        >
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1 ? true : undefined} className="flex shrink-0 gap-6 pr-6">
          {prizes.map((prize) => (
            <div key={prize.id} className="flex w-[280px] shrink-0 sm:w-[310px]">
              <PrizeCard
                name={prize.name}
                imageUrl={prize.image_url}
                originalQuantity={prize.original_quantity}
                sponsorName={prize.sponsor_name}
              />
            </div>
          ))}
            </div>
          ))}
        </div>

      </div>
    </Panel>
  );
}
