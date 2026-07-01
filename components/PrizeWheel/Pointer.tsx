"use client";

import { motion } from "framer-motion";

type Props = {
  spinning: boolean;
};

export default function Pointer({ spinning }: Props) {
  return (
    <motion.div
      className="absolute z-50 left-1/2 -translate-x-1/2"
      style={{
        top: -45,
      }}
      animate={
        spinning
          ? {
              rotate: [0, -12, 8, -6, 4, 0],
            }
          : {}
      }
      transition={{
        repeat: spinning ? Infinity : 0,
        duration: 0.12,
      }}
    >
      <svg
        width="120"
        height="150"
        viewBox="0 0 120 150"
      >
        <defs>
          <linearGradient id="gold" x1="0" x2="1">
            <stop offset="0%" stopColor="#FFF7CC" />
            <stop offset="20%" stopColor="#F6D365" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="80%" stopColor="#B8860B" />
            <stop offset="100%" stopColor="#FFF7CC" />
          </linearGradient>

          <filter id="shadow">
            <feDropShadow
              dx="0"
              dy="5"
              stdDeviation="6"
              floodOpacity=".35"
            />
          </filter>
        </defs>

        {/* Gold Housing */}
        <ellipse
          cx="60"
          cy="20"
          rx="24"
          ry="16"
          fill="url(#gold)"
          filter="url(#shadow)"
        />

        {/* Spring */}
        <rect
          x="56"
          y="20"
          width="8"
          height="22"
          rx="4"
          fill="#777"
        />

        {/* Pointer */}
        <polygon
          points="60,120 32,42 88,42"
          fill="url(#gold)"
          stroke="#8B6914"
          strokeWidth="3"
          filter="url(#shadow)"
        />

        {/* Shine */}
        <polygon
          points="60,110 45,48 52,48"
          fill="white"
          opacity=".4"
        />

        {/* Bolt */}
        <circle
          cx="60"
          cy="20"
          r="8"
          fill="#EEE"
          stroke="#888"
          strokeWidth="2"
        />
      </svg>
    </motion.div>
  );
}