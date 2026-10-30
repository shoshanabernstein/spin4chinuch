"use client";

import { useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import Link from "next/link";
import WheelSlice from "./WheelSlice";
import WheelLabel from "./WheelLabel";
import Pointer from "./Pointer";
import { getPrizeDisplay } from "@/lib/prize-display";
import { crossedWheelBoundary } from "@/lib/wheel-feedback";

type Prize = {
  id: number;
  label: string;
  prize_id: number | null;
  sponsor_name?: string | null;
};

type PrizeWheelProps = {
  rotation: number;
  spinning: boolean;
  spinPhase: "idle" | "requesting" | "revealing";
  canSpin: boolean;
  showBuySpins?: boolean;
  purchaseBlockedLabel?: string;
  onBuySpins?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  onSpin: () => void;
  prizes: Prize[];
  onRotationUpdate: (angle: number) => void;
  onTick: () => void;
  onSpinComplete: () => void;
};

const SIZE = 900;
const CENTER = 450;
const RADIUS = 392;
const COLORS = [
  "#173B73",
  "#C9A44D",
  "#2F6ED8",
  "#0F7892",
  "#234F91",
  "#D6B967",
  "#3D7FDB",
  "#17677C",
];

export default function PrizeWheel({
  rotation,
  spinning,
  spinPhase,
  canSpin,
  showBuySpins = false,
  purchaseBlockedLabel,
  onBuySpins,
  onSpin,
  prizes,
  onRotationUpdate,
  onTick,
  onSpinComplete,
}: PrizeWheelProps) {
  const slices = Math.max(prizes.length, 1);
  const angle = 360 / slices;
  const previousRotation = useRef(rotation);
  const pointerControls = useAnimationControls();

  return (
    <div className="relative mx-auto aspect-square w-full [container-type:inline-size]">
      <div className="absolute inset-[3%] rounded-full bg-[#2F6ED8]/20 blur-3xl" />

      <Pointer muted={showBuySpins && !spinning} controls={pointerControls} />

      <motion.div
        className={`absolute inset-0 transition-opacity duration-500 ${showBuySpins && !spinning ? "opacity-50" : "opacity-100"}`}
        animate={{ rotate: rotation }}
        onUpdate={(latest) => {
          const current = Number(latest.rotate);
          const previous = previousRotation.current;
          previousRotation.current = current;
          onRotationUpdate(current);
          if (spinning && !document.hidden && crossedWheelBoundary(previous, current, angle)) {
            void pointerControls.start({ rotate: [0, -10, 0], transition: { duration: 0.075, ease: "easeOut" } });
            onTick();
          }
        }}
        onAnimationComplete={() => {
          if (spinPhase === "revealing") {
            pointerControls.set({ rotate: 0 });
            onSpinComplete();
          }
        }}
        transition={
          spinPhase === "requesting"
            ? { duration: 2.4, ease: "linear", repeat: Infinity }
            : spinPhase === "revealing"
              ? { duration: 7.5, ease: [0.2, 0.6, 0.25, 1] }
              : { duration: 0.25, ease: "linear" }
        }
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-full w-full drop-shadow-[0_24px_45px_rgba(7,22,40,.28)]"
          role="img"
          aria-label="Spin for Chinuch prize wheel"
        >
          <defs>
            {COLORS.map((color, index) => (
              <linearGradient
                key={color}
                id={`sliceGradient${index}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity="0.82" />
                <stop offset="45%" stopColor={color} />
                <stop offset="100%" stopColor="#071628" stopOpacity="0.32" />
              </linearGradient>
            ))}

            <linearGradient id={`sliceGradient${COLORS.length}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="52%" stopColor="#17263A" />
              <stop offset="100%" stopColor="#07111F" />
            </linearGradient>

            <linearGradient id="outerGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F5DE98" />
              <stop offset="28%" stopColor="#C9A44D" />
              <stop offset="55%" stopColor="#FFF0B8" />
              <stop offset="82%" stopColor="#A9822E" />
              <stop offset="100%" stopColor="#E8CD7A" />
            </linearGradient>

            <radialGradient id="hubNavy">
              <stop offset="0%" stopColor="#234F91" />
              <stop offset="100%" stopColor="#071628" />
            </radialGradient>

            <filter id="softWheelShadow">
              <feDropShadow dx="0" dy="14" stdDeviation="18" floodOpacity="0.3" />
            </filter>
            <filter id="labelShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.65" />
            </filter>
          </defs>

          <circle
            cx={CENTER}
            cy={CENTER}
            r="438"
            fill="#071628"
            stroke="url(#outerGold)"
            strokeWidth="18"
            filter="url(#softWheelShadow)"
          />

          <circle
            cx={CENTER}
            cy={CENTER}
            r="414"
            fill="#0C1F38"
            stroke="#FFFFFF"
            strokeOpacity="0.18"
            strokeWidth="3"
          />

          {prizes.length > 0 &&
            prizes.map((prize, index) => (
              <WheelSlice
                key={prize.id}
                radius={RADIUS}
                startAngle={index * angle}
                endAngle={(index + 1) * angle}
                gradientIndex={prize.label === "?" ? 1 : prize.prize_id ? index % COLORS.length : COLORS.length}
              />
            ))}

          {prizes.map((prize, index) => (
            <WheelLabel
              key={prize.id}
              label={prize.prize_id
                ? getPrizeDisplay(prize.label, prize.sponsor_name).title
                : prize.label.trim().toLowerCase() === "try again"
                  ? "Better luck next time"
                  : prize.label}
              provider={prize.prize_id ? getPrizeDisplay(prize.label, prize.sponsor_name).provider : null}
              angle={index * angle + angle / 2}
              sliceAngle={angle}
            />
          ))}

          {Array.from({ length: 32 }).map((_, index) => {
            const lightAngle = (index / 32) * Math.PI * 2;
            const x = CENTER + Math.cos(lightAngle) * 423;
            const y = CENTER + Math.sin(lightAngle) * 423;

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="5"
                fill={index % 2 === 0 ? "#FFF3BE" : "#C9A44D"}
                opacity={spinning ? 1 : 0.82}
              />
            );
          })}

          <circle
            cx={CENTER}
            cy={CENTER}
            r="124"
            fill="url(#hubNavy)"
            stroke="url(#outerGold)"
            strokeWidth="12"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r="108"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.12"
            strokeWidth="2"
          />
        </svg>
      </motion.div>

      {showBuySpins && !spinning && purchaseBlockedLabel ? (
        <div role="status" className="absolute left-1/2 top-1/2 z-30 flex h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#E8CD7A]/40 bg-[#102743] p-2 text-center text-[clamp(.6rem,2.6cqw,1.5rem)] font-bold leading-tight text-[#F0D47F]">
          {purchaseBlockedLabel}
        </div>
      ) : showBuySpins && !spinning ? (
        <Link
          href="/buy-spins"
          onClick={onBuySpins}
          aria-label="No spins left. Buy spins"
          className="absolute left-1/2 top-1/2 z-30 flex h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#FFF0B5]/70 bg-gradient-to-br from-[#FAE8A8] via-[#E8C761] to-[#C9A44D] text-center text-[clamp(.7rem,3cqw,1.75rem)] font-black leading-tight tracking-wide text-[#102743] shadow-[0_0_28px_rgba(232,199,97,.35)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F0D47F] motion-safe:animate-[wheel-buy-pulse_2.4s_ease-in-out_infinite]"
        >
          <span className="text-[clamp(.8rem,3.6cqw,2rem)] font-black leading-none tracking-[0.08em]">BUY</span>
          <span className="mt-1 text-[clamp(1rem,4.8cqw,2.75rem)] font-black leading-none tracking-tight">SPINS</span>
        </Link>
      ) : <button
        type="button"
        onClick={onSpin}
        disabled={!canSpin}
        aria-label={spinning ? "Wheel is spinning" : "Spin the prize wheel"}
        className="absolute left-1/2 top-1/2 z-30 flex h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#F0D47F]/70 bg-[radial-gradient(circle_at_35%_25%,#2B548A,#16365F_55%,#0A203C)] text-[clamp(.9rem,4.5cqw,2.75rem)] font-black tracking-[0.1em] text-[#FFF3C4] shadow-[inset_0_2px_4px_rgba(255,255,255,.2),inset_0_-8px_20px_rgba(0,0,0,.25),0_0_22px_rgba(232,199,97,.18),0_12px_30px_rgba(7,22,40,.5)] transition duration-200 hover:scale-105 hover:brightness-115 focus:outline-none focus:ring-4 focus:ring-[#5E9CF4]/35 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:scale-100"
      >
        {spinning ? (
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
          </span>
        ) : (
          <span className={canSpin ? "wheel-spin-label" : undefined}>SPIN</span>
        )}
      </button>}
    </div>
  );
}
