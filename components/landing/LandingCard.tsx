import { ReactNode } from "react";
import Link from "next/link";

interface LandingCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
}

export default function LandingCard({
  title,
  description,
  icon,
  href,
}: LandingCardProps) {
  return (
    <Link data-landing="step"
      href={href}
      className="
        group
        relative
        overflow-hidden
        rounded-[24px]
        border
        border-blue-100
        bg-white
        p-6
        shadow-sm
        transition-all
        duration-300
        motion-safe:hover:-translate-y-1
        hover:shadow-lg
        focus-visible:outline-2
        focus-visible:outline-offset-4
        focus-visible:outline-[#4267A8]
      "
    >
      {/* Decorative gradient */}
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-[#80A8F7]/20 to-transparent blur-3xl" />

      <div className="relative">
        <div
          className="
            mb-5
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            from-[#4267A8]
            to-[#80A8F7]
            text-white
            shadow-lg
          "
        >
          {icon}
        </div>

        <h3 className="text-lg font-bold text-[#142A52]">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </Link>
  );
}
