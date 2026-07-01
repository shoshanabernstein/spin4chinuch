
"use client";

import { motion } from "framer-motion";

export default function Lights() {
  const total = 60;

  const center = 450;
  const radius = 438;

  return (
    <>
      {Array.from({ length: total }).map((_, i) => {
        const angle = (i / total) * Math.PI * 2;

        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;

        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="6"
            fill="#FFD54A"
            stroke="#FFF8DC"
            strokeWidth="2"
            animate={{
              opacity: [0.25, 1, 0.25],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.03,
            }}
            style={{
              filter: "drop-shadow(0 0 8px #FFD54A)",
            }}
          />
        );
      })}
    </>
  );
}