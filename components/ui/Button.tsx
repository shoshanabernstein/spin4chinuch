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
  disabled?: boolean;
  type?: "button" | "submit";
}

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}: ButtonProps) {
  const base =
    "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 font-bold transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200";

  const variants: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white hover:brightness-110",

    secondary:
      "bg-[var(--card)] border border-[var(--border)] text-white hover:bg-[var(--surface)]",

    outline:
      "border border-[var(--primary)] text-[var(--primary-light)] bg-transparent hover:bg-[var(--primary)]/10",

    gold:
      "bg-gradient-to-r from-[#C9A44D] to-[#E7C96D] text-[#142A52]",

    danger:
      "bg-gradient-to-r from-red-600 to-red-700 text-white",
  };

  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed hover:scale-100 pointer-events-none"
    : "";

  const classes = `${base} ${variants[variant]} ${className} ${disabledStyles}`;

  // If it's a link, ignore disabled (correct behavior for navigation)
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={classes}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}
