
"use client";

import { motion } from "framer-motion";

type Props = {
  spinning: boolean;
};

export default function CenterButton({ spinning }: Props) {
  return (
    <motion.g
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
        SPIN
      </text>
    </motion.g>
  );
}