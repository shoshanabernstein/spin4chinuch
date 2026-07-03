import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-3xl
        bg-white/75
        backdrop-blur-xl
        border border-white/70
        shadow-[0_20px_60px_rgba(20,42,82,.12)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}