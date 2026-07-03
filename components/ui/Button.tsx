import Link from "next/link";

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "gold" | "green" | "ghost";
  className?: string;
  onClick?: () => void;
};

export default function Button({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 font-bold transition hover:scale-105 shadow-xl";

  const styles = {
    primary: "bg-gradient-to-r from-[#2F6ED8] to-[#5E9CF4] text-white",
    gold: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 text-[#142A52]",
    green: "bg-gradient-to-r from-green-500 to-emerald-700 text-white",
    ghost: "bg-white/10 text-white border border-white/10",
  };

  const cls = `${base} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}