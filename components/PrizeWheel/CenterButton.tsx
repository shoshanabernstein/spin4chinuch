
"use client";

import { motion } from "framer-motion";

type Props = {
  spinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
};

export default function CenterButton({ spinning, canSpin, onSpin }: Props) {
  return (
    <motion.g
      role="button"
      tabIndex={canSpin ? 0 : -1}
      aria-label={spinning ? "Wheel is spinning" : "Spin the prize wheel"}
      aria-disabled={!canSpin}
      onClick={canSpin ? onSpin : undefined}
      onKeyDown={(event) => {
        if (canSpin && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSpin();
        }
      }}
      style={{ cursor: canSpin ? "pointer" : "not-allowed", opacity: canSpin ? 1 : 0.65 }}
      animate={
        spinning
          ? {
              scale: [1, 0.97, 1],
            }
          : {
              scale: [1, 1.03, 1],
            }
      }
      transition={{
        repeat: Infinity,
        duration: spinning ? 0.2 : 2,
      }}
    >
      <circle
        cx="450"
        cy="450"
        r="110"
        fill="#D4AF37"
        stroke="#FFF4B0"
        strokeWidth="8"
      />

      <circle
        cx="450"
        cy="450"
        r="82"
        fill="#163D7A"
      />

      <ellipse
        cx="450"
        cy="450"
        rx="35"
        ry="12"
        fill="white"
        opacity=".35"
      />

      <text
        x="450"
        y="450"
        textAnchor="middle"
        fontSize="34"
        fontWeight="900"
        fill="white"
        letterSpacing="2"
      >
        {spinning ? "..." : "SPIN"}
      </text>
    </motion.g>
  );
}