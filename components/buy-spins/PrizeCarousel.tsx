"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
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

interface PrizeCarouselProps { prizes: Prize[]; }

export default function PrizeCarousel({ prizes }: PrizeCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionUntil = useRef(0);
  const hovering = useRef(false);
  const focused = useRef(false);
  useEffect(() => {
    const container = containerRef.current;
    if (!container || prizes.length === 0) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previousTime = 0;
    let position = container.scrollLeft;
    let direction = 1;
    function animate(time: number) {
      const elapsed = previousTime ? Math.min(time - previousTime, 40) : 0;
      previousTime = time;
      const maximum = container!.scrollWidth - container!.clientWidth;
      if (!reducedMotion.matches && !document.hidden &&
          !hovering.current && !focused.current && time > interactionUntil.current && maximum > 1) {
        // Keep fractional pixels for consistent motion at every frame rate.
        position += direction * elapsed * 0.026;
        if (position >= maximum) { position = maximum; direction = -1; }
        if (position <= 0) { position = 0; direction = 1; }
        container!.scrollLeft = position;
      } else {
        position = container!.scrollLeft;
      }
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [prizes]);

  function pauseForInteraction() {
    interactionUntil.current = performance.now() + 5000;
  }

  function browse(direction: number) {
    const container = containerRef.current;
    if (!container) return;
    pauseForInteraction();
    const card = container.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : container.clientWidth;
    container.scrollBy({
      left: direction * step,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }


  return (
    <section
      onPointerEnter={event => { if (event.pointerType === "mouse") hovering.current = true; }}
      onPointerLeave={() => { hovering.current = false; }}
      onFocusCapture={() => { focused.current = true; }}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focused.current = false; }}
      aria-labelledby="purchase-prizes-title" className="min-w-0 overflow-hidden rounded-[28px] border border-[#DFE7F2] bg-white shadow-[0_12px_40px_rgba(20,42,82,.07)] sm:rounded-[32px]">
      <div className="relative isolate overflow-hidden border-b border-[#E7EDF5] bg-gradient-to-r from-white via-[#FCFCFA] to-[#FAF6EB] px-6 py-5 sm:px-8 sm:py-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 h-56 w-56 rounded-full border-[24px] border-[#C9A44D]/[.055]" />
        <div className="relative flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="h-10 w-1 rounded-full bg-gradient-to-b from-[#E9D38E] to-[#B38A32] shadow-[0_0_14px_rgba(201,164,77,.12)]" />
            <h2 id="purchase-prizes-title" className="text-3xl font-extrabold leading-none tracking-[-.04em] text-[#142A52] sm:text-[34px]">Prizes</h2>
          </div>
          <div aria-hidden="true" className="hidden h-px flex-1 bg-gradient-to-r from-[#DDE5F0] via-[#E7DEC7] to-transparent sm:block" />
          <Link href="/prizes" aria-label="View all prizes" className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#E6D8B2] bg-white/80 text-[#A38232] shadow-[0_3px_12px_rgba(156,124,53,.06)] transition hover:border-[#C9A44D] hover:bg-[#FFF8E5] hover:shadow-[0_5px_16px_rgba(156,124,53,.12)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F6ED8] sm:h-14 sm:w-14">
            <Gift className="h-6 w-6 motion-safe:transition-transform motion-safe:group-hover:-rotate-6 sm:h-7 sm:w-7" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {prizes.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Gift className="mx-auto h-12 w-12 text-[#C9A44D]" strokeWidth={1.3} aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold text-[#142A52]">New prizes are on their way</p>
          <p className="mt-2 text-sm text-[#697B94]">Check back soon to see what our sponsors have in store.</p>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            onTouchStart={pauseForInteraction}
            onTouchMove={pauseForInteraction}
            onWheel={pauseForInteraction}
            role="region"
            aria-label="Browse donated prizes"
            tabIndex={0}
            onKeyDown={event => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault(); browse(event.key === "ArrowLeft" ? -1 : 1);
              }
            }}
            className="flex items-stretch gap-5 overflow-x-auto bg-[#F8FAFD] px-5 py-7 [scroll-padding-inline:1.25rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#2F6ED8] sm:px-8 sm:py-8 sm:[scroll-padding-inline:2rem]"
          >
            {prizes.map(prize => (
              <div key={prize.id} className="flex w-[min(280px,82vw)] shrink-0 sm:w-[300px]">
                <PrizeCard gallery playful name={prize.name} imageUrl={prize.image_url} originalQuantity={prize.original_quantity} sponsorName={prize.sponsor_name} />
              </div>
            ))}
          </div>

        </>
      )}
    </section>
  );
}
