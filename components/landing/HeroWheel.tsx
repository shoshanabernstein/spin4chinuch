import { Gift } from "lucide-react";
import styles from "./HeroWheel.module.css";

const colors = ["#102A52", "#649CD3", "#D8E7F3", "#244B75", "#E7C96D", "#467EB3", "#B5D0E7", "#193A60"];

function sector(index: number) {
  const start = (index * 45 - 90) * Math.PI / 180;
  const end = start + Math.PI / 4;
  return `M240 240 L${240 + 158 * Math.cos(start)} ${240 + 158 * Math.sin(start)} A158 158 0 0 1 ${240 + 158 * Math.cos(end)} ${240 + 158 * Math.sin(end)} Z`;
}

export default function HeroWheel() {
  return (
    <div className={styles.illustration} aria-hidden="true">
      <svg viewBox="0 0 480 480" fill="none" className={styles.wheel}>
        <defs>
          <radialGradient id="hero-wheel-halo">
            <stop stopColor="#D8E7F3" stopOpacity=".65" />
            <stop offset="1" stopColor="#D8E7F3" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hero-wheel-pointer" x1="225" y1="62" x2="253" y2="107" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F3E2A7" /><stop offset="1" stopColor="#C9A44D" />
          </linearGradient>
        </defs>
        <circle cx="240" cy="240" r="233" fill="url(#hero-wheel-halo)" />
        <g className={styles.outerOrbit}>
          <circle cx="240" cy="240" r="213" stroke="#8FB5D8" strokeWidth="1.5" strokeDasharray="1050 289" strokeLinecap="round" />
          <path d="M52 353a220 220 0 0 0 22 29" stroke="#BFD7EF" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g className={styles.innerOrbit}>
          <circle cx="240" cy="240" r="193" stroke="#B5CFE6" strokeWidth="6" strokeDasharray="800 413" strokeLinecap="round" />
        </g>
        <circle cx="240" cy="247" r="165" fill="#102A52" opacity=".06" />
        <circle cx="240" cy="240" r="164" fill="#FAF8F3" stroke="#CCDCEB" />
        {colors.map((color, index) => (
          <path key={color} d={sector(index)} fill={color} stroke="#FAF8F3" strokeWidth="2.5" strokeLinejoin="round" />
        ))}
        {Array.from({ length: 16 }, (_, index) => {
          const angle = index * Math.PI / 8;
          return <circle key={index} cx={240 + 171 * Math.cos(angle)} cy={240 + 171 * Math.sin(angle)} r="2" fill="#8BA8C4" />;
        })}
        <circle cx="240" cy="240" r="40" fill="#FAF8F3" />
        <circle cx="240" cy="240" r="33" fill="#102A52" />
        <Gift x="225" y="225" width="30" height="30" color="#F0D47F" strokeWidth="1.5" />
        <path d="M226 67h28l-14 37Z" fill="url(#hero-wheel-pointer)" stroke="#FAF8F3" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
