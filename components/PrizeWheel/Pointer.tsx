"use client";

import { motion, useAnimationControls } from "framer-motion";

type Props = {
  muted?: boolean;
  controls: ReturnType<typeof useAnimationControls>;
};

export default function Pointer({ muted = false, controls }: Props) {
  return (
    <div className={`pointer-events-none absolute inset-0 z-50 rotate-90 transition-opacity duration-500 ${muted ? "opacity-50" : "opacity-100"}`} aria-hidden="true">
    <motion.div
      className="absolute -top-[5%] left-1/2 aspect-[4/5] w-[16%] -translate-x-1/2"
      animate={controls}
    >
      <svg
        width="100%"
        height="100%"
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
    </div>
  );
}
