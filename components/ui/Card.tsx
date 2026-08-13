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
        bg-white/90
        backdrop-blur-xl
        border border-blue-100
        shadow-[0_16px_45px_rgba(20,42,82,.10)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
