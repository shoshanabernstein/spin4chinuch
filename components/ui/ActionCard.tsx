import Link from "next/link";
import Card from "./Card";
import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  icon: ReactNode;
}

export default function ActionCard({
  title,
  description,
  buttonText,
  href,
  icon,
}: ActionCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="relative overflow-hidden p-8 bg-gradient-to-br from-[#142A52] to-[#2F4F88] text-white">
        {/* Background glow */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl transition-all duration-500 group-hover:bg-[var(--primary)]/20" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white shadow-xl">
            {icon}
          </div>

          <h2 className="text-3xl font-bold">

            {title}
          </h2>

          <p className="mt-4 text-blue-100 leading-relaxed flex-1">           
             {description}
          </p>

          <div className="mt-8 flex items-center font-semibold text-[#E7C96D]">
            {buttonText}
            <ChevronRight size={18} className="ml-2" />
          </div>
        </div>
      </Card>
    </Link>
  );
}