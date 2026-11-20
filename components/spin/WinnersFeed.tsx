"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";

type Winner = { id: number; initials: string; prize: string };

const REFRESH_MS = 60_000;
const SPEED_PX_PER_MS = 0.02;

export default function WinnersFeed({ className = "" }: { className?: string }) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/recent-winners", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { winners?: Winner[] };
        if (!cancelled && data.winners) setWinners(data.winners);
      } catch {
        // Keep showing the last list we had.
      }
    }
    void load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Scroll downward through the list forever: the list is rendered twice, and
  // once the first copy has scrolled out of view we jump back seamlessly.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || reduceMotion || winners.length < 2) return;
    let frame = 0;
    let previous = 0;
    let position = scroller.scrollTop;
    function step(time: number) {
      const elapsed = previous ? Math.min(time - previous, 40) : 0;
      previous = time;
      const loopHeight = scroller!.scrollHeight / 2;
      if (loopHeight > scroller!.clientHeight) {
        position += elapsed * SPEED_PX_PER_MS;
        if (position >= loopHeight) position -= loopHeight;
        scroller!.scrollTop = position;
      } else {
        position = scroller!.scrollTop;
      }
      frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [winners, reduceMotion]);

  if (winners.length === 0) return null;

  const loop = !reduceMotion && winners.length >= 2;
  const rows = loop ? [...winners, ...winners] : winners;


  // A long, narrow strip of separate winner cards gliding past.
  return (
    <section aria-label="Recent winners" className={`flex min-h-0 flex-col items-center ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gradient-to-r from-transparent to-[#E5CC8A]/60" />
        <h2 className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5CC8A]">Recent winners</h2>
        <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gradient-to-l from-transparent to-[#E5CC8A]/60" />
      </div>
      <div
        ref={scrollerRef}
        className={`relative min-h-0 w-full flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${loop ? "overflow-hidden" : "overflow-y-auto"} [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]`}
      >
        <ul>
          {rows.map((winner, index) => (
            <li key={`${winner.id}-${index}`} aria-hidden={index >= winners.length ? true : undefined} className="pb-3">
              <div className="relative overflow-hidden rounded-2xl border border-[#E8CD7A]/20 bg-gradient-to-br from-[#203854]/90 to-[#0D2038]/90 px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_10px_24px_rgba(0,0,0,.25)]">
                <div aria-hidden="true" className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#F4DE97]/50 bg-gradient-to-br from-[#F6E3A2] to-[#BF9636] text-[#203149]">
                  <Trophy className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <p className="truncate text-sm font-bold text-[#F0F5FC]">{winner.initials}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-[#E5CC8A]">{winner.prize}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
