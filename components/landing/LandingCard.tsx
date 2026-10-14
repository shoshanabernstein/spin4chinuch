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
    <Link
      href={href}
      className="
        group
        relative
        overflow-hidden
        rounded-[30px]
        border
        border-blue-100
        bg-white
        p-8
        shadow-md
        transition-all
        duration-300
        hover:-translate-y-2
        hover:shadow-2xl
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
            mb-6
            flex
            h-16
            w-16
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

        <h3 className="text-3xl font-bold text-[#142A52]">
          {title}
        </h3>

        <p className="mt-4 leading-7 text-slate-600">
          {description}
        </p>
      </div>
    </Link>
  );
}
