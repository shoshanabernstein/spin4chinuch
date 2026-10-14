/* eslint-disable @next/next/no-img-element */
import { Gift, HeartHandshake } from "lucide-react";
import Card from "@/components/ui/Card";
import { getPrizeDisplay } from "@/lib/prize-display";
import type { ReactNode } from "react";

interface PrizeCardProps {
  name: string;
  imageUrl?: string | null;
  originalQuantity?: number | null;
  sponsorName?: string | null;
  children?: ReactNode;
}

export default function PrizeCard({
  name,
  imageUrl,
  originalQuantity,
  sponsorName,
  children,
}: PrizeCardProps) {
  const display = getPrizeDisplay(name, sponsorName);
  return (
    <Card
      className="
        group flex h-full w-full flex-col overflow-hidden rounded-3xl
        border border-slate-200
        bg-white
        shadow-sm
        transition-all duration-300
        hover:-translate-y-2
        hover:shadow-xl
      "
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#EEF4FF] to-[#FFF8DF]">
            <Gift className="h-16 w-16 text-[#4267A8]/35" aria-hidden />
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Original prize quantity, independent of remaining stock. */}
        {typeof originalQuantity === "number" && Number.isInteger(originalQuantity) && originalQuantity >= 0 && (
          <div className="absolute top-4 right-4 rounded-full bg-[#C9A44D] px-4 py-2 text-sm font-bold text-white shadow-lg">
            {originalQuantity.toLocaleString()} {originalQuantity === 1 ? "prize" : "prizes"}
          </div>
        )}
      </div>

      <div className="min-h-[104px] flex-1 p-6 pb-5 text-center">
        <h3 className="text-xl font-bold leading-tight text-[#142A52]">
          {display.title}
        </h3>
        {display.provider && (
          <>
            <div aria-hidden="true" className="mx-auto my-3 h-px w-[70%] bg-[#C9A44D]/60" />
            <p className="break-words text-lg font-semibold text-[#142A52]">{display.provider}</p>
          </>
        )}
      </div>

      <div className="flex min-h-[73px] items-center gap-3 border-t border-[#DCE7F6] bg-gradient-to-r from-[#F5F8FD] to-[#FFF9E8] px-6 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A44D]/15 text-[#9A7421]">
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B7F9E]">
              Sponsored by
            </p>
            <p className="mt-0.5 break-words font-bold text-[#142A52]">
              {sponsorName || "Sponsor details coming soon"}
            </p>
          </div>
        </div>
      {children}
    </Card>
  );
}
