"use client";

import { motion } from "framer-motion";
import WheelSlice from "./WheelSlice";
import { wheelColors } from "./colors";
import Lights from "./Lights";
import Pointer from "./Pointer";
import CenterButton from "./CenterButton";

type Outcome = {
  id: number | string;
  label: string;
  prize_id?: number | string | null;
};

type PrizeWheelProps = {
  rotation: number;
  spinning: boolean;
  prizes: Outcome[];
  canSpin: boolean;
  onSpin: () => void;
};

const SIZE = 900;
const CENTER = 450;
const RADIUS = 405;

export default function PrizeWheel({
  rotation,
  spinning,
  prizes,
  canSpin,
  onSpin,
}: PrizeWheelProps) {
  const slices = Math.max(prizes.length, 1);
  const angle = 360 / slices;

  return (
    <div className="relative w-[min(86vw,620px)] drop-shadow-[0_30px_80px_rgba(0,0,0,.45)]">
      <Pointer spinning={spinning} />

      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute inset-0 rounded-full bg-yellow-400/20 blur-3xl"
      />

      <motion.div
        animate={{ rotate: rotation }}
        transition={{ duration: 7.5, ease: [0.12, 0.95, 0.18, 1] }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full"
          role="img"
          aria-label="Prize wheel"
        >
          <defs>
            <linearGradient id="goldRing" x1="0" x2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>

            {wheelColors.map((color, index) => (
              <linearGradient key={color} id={`sliceGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity=".35" />
                <stop offset="15%" stopColor={color} />
                <stop offset="75%" stopColor={color} />
                <stop offset="100%" stopColor="black" stopOpacity=".35" />
              </linearGradient>
            ))}

            <linearGradient id="metalGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF8D6" />
              <stop offset="35%" stopColor="#B8860B" />
              <stop offset="50%" stopColor="#FFF5C3" />
              <stop offset="100%" stopColor="#FFF8D6" />
            </linearGradient>
          </defs>

          <Lights />
          <circle cx={CENTER} cy={CENTER} r={360} fill="url(#metalGold)" />
          <circle cx={CENTER} cy={CENTER} r={345} fill="#111827" />

          {prizes.map((prize, index) => (
            <WheelSlice
              key={prize.id}
              radius={RADIUS}
              startAngle={index * angle}
              endAngle={(index + 1) * angle}
              color={wheelColors[index % wheelColors.length]}
              gradientIndex={index % wheelColors.length}
            />
          ))}

          {prizes.map((prize, index) => {
            const textAngle = index * angle + angle / 2;
            const label = prize.label.length > 18 ? `${prize.label.slice(0, 15)}...` : prize.label;

            return (
              <text
                key={`label-${prize.id}`}
                x={CENTER}
                y={CENTER - 250}
                fill="white"
                fontSize={prizes.length > 10 ? "18" : "24"}
                fontWeight="900"
                textAnchor="middle"
                transform={`rotate(${textAngle} ${CENTER} ${CENTER})`}
              >
                {label}
              </text>
            );
          })}

          <circle cx={CENTER} cy={CENTER} r={210} fill="none" stroke="url(#goldRing)" strokeWidth="8" />
          <CenterButton spinning={spinning} canSpin={canSpin} onSpin={onSpin} />
        </svg>
      </motion.div>
    </div>
  );
}
