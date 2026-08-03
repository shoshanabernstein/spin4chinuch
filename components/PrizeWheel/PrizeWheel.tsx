"use client";

import { motion } from "framer-motion";
import WheelSlice from "./WheelSlice";
import Pointer from "./Pointer";

type Prize = {
  id: number;
  label: string;
  prize_id: number | null;
};

type PrizeWheelProps = {
  rotation: number;
  spinning: boolean;
  spinPhase: "idle" | "requesting" | "revealing";
  canSpin: boolean;
  onSpin: () => void;
  prizes: Prize[];
};

function splitWheelLabel(label: string) {
  const compact = label
    .replace(/\s*\(up to 6\)\s*/i, " ")
    .replace(/\bGift Cards?\b/gi, "")
    .replace(/\bSession\b/gi, "")
    .replace(/Music Theory Lesson/i, "Music Lesson")
    .trim();
  const words = compact.split(/\s+/);
  const lines: string[] = [];

  for (const word of words) {
    const current = lines.at(-1);
    if (!current || (current.length + word.length + 1 > 13 && lines.length < 2)) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`;
    }
  }

  return lines.slice(0, 2);
}

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
  onSpin,
  prizes,
}: PrizeWheelProps) {
  const slices = Math.max(prizes.length, 1);
  const angle = 360 / slices;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[610px]">
      <div className="absolute inset-[3%] rounded-full bg-[#2F6ED8]/20 blur-3xl" />

      <Pointer spinning={spinning} />

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: rotation }}
        transition={
          spinPhase === "requesting"
            ? { duration: 2.4, ease: "linear" }
            : spinPhase === "revealing"
              ? { duration: 7.5, ease: [0.12, 0.82, 0.16, 1] }
              : { duration: 0.2 }
        }
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-full w-full drop-shadow-[0_24px_45px_rgba(7,22,40,.28)]"
          role="img"
          aria-label="Spin4Chinuch prize wheel"
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
                gradientIndex={prize.prize_id ? index % COLORS.length : COLORS.length}
              />
            ))}

          {prizes.length > 0 &&
            prizes.map((prize, index) => {
              const textAngle = index * angle + angle / 2;
              const labelLines = splitWheelLabel(prize.label);
              const firstLineY = 125 - (labelLines.length - 1) * 11;

              return (
                <text
                  key={`label-${prize.id}`}
                  x={CENTER}
                  y={firstLineY}
                  fill="white"
                  fontSize={prizes.length > 10 ? "20" : "23"}
                  fontWeight="750"
                  textAnchor="middle"
                  letterSpacing=".15"
                  transform={`rotate(${textAngle} ${CENTER} ${CENTER})`}
                  filter="url(#labelShadow)"
                >
                  {labelLines.map((line, lineIndex) => (
                    <tspan
                      key={`${prize.id}-${lineIndex}`}
                      x={CENTER}
                      dy={lineIndex === 0 ? 0 : 25}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })}

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
            r="112"
            fill="url(#hubNavy)"
            stroke="url(#outerGold)"
            strokeWidth="12"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r="88"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.12"
            strokeWidth="2"
          />
        </svg>
      </motion.div>

      <button
        type="button"
        onClick={onSpin}
        disabled={!canSpin}
        aria-label={spinning ? "Wheel is spinning" : "Spin the prize wheel"}
        className="absolute left-1/2 top-1/2 z-30 flex h-[19%] w-[19%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#102F57] text-[clamp(.75rem,2.5vw,1.25rem)] font-black tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_12px_30px_rgba(7,22,40,.35)] transition duration-200 hover:scale-105 hover:bg-[#173B73] focus:outline-none focus:ring-4 focus:ring-[#5E9CF4]/35 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:scale-100"
      >
        {spinning ? (
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
          </span>
        ) : (
          "SPIN"
        )}
      </button>
    </div>
  );
}
