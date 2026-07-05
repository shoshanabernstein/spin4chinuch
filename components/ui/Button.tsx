import Link from "next/link";
import { ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "gold"
  | "danger";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
}

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";

  const variants: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-md hover:shadow-lg hover:brightness-110",

    secondary:
      "border border-white/25 bg-white/15 text-white backdrop-blur hover:bg-white/25",

    outline:
      "border border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white",

    gold:
      "bg-gradient-to-r from-[#C9A44D] to-[#E7C96D] text-[#142A52] shadow-md hover:shadow-lg",

    danger:
      "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:shadow-lg",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}