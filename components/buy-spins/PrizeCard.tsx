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
  compact?: boolean;
  gallery?: boolean;
}

export default function PrizeCard({
  name,
  imageUrl,
  originalQuantity,
  sponsorName,
  children,
  compact = false,
  gallery = false,
}: PrizeCardProps) {
  const display = getPrizeDisplay(name, sponsorName);
  return (
    <Card
      className={gallery ? "group flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-[#DFE7F2] bg-white shadow-[0_4px_16px_rgba(20,42,82,.04)] transition-[border-color,box-shadow] duration-300 hover:border-[#B9CDEA] hover:shadow-[0_12px_30px_rgba(20,42,82,.09)]" : `
        group flex h-full w-full flex-col overflow-hidden rounded-3xl
        border border-slate-200
        bg-white
        shadow-sm
        transition-all duration-300
        hover:-translate-y-2
        hover:shadow-xl
      `}
    >
      {/* Image */}
      <div className={`relative w-full shrink-0 overflow-hidden ${gallery ? "bg-gradient-to-b from-[#F3F6FB] to-[#FAFBFD]" : "bg-slate-100"} ${compact ? "h-32" : gallery ? "aspect-[3/2]" : "aspect-[4/3]"}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className={`h-full w-full object-contain transition-transform duration-500 motion-safe:group-hover:scale-105 ${compact ? "p-3" : "p-6"}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#EEF4FF] to-[#FFF8DF]">
            <Gift className="h-16 w-16 text-[#4267A8]/35" aria-hidden />
          </div>
        )}

        {/* Gradient */}
        {!gallery && <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />}

        {/* Original prize quantity, independent of remaining stock. */}
        {typeof originalQuantity === "number" && Number.isInteger(originalQuantity) && originalQuantity >= 0 && (
          <div className={`absolute rounded-full ${gallery ? "border border-[#E5D39B] bg-[#FFF7DC] text-[#86631D] shadow-sm" : "bg-[#C9A44D] text-white shadow-lg"} font-bold ${compact ? "top-2 right-2 px-2 py-1 text-xs" : "top-4 right-4 px-4 py-2 text-sm"}`}>
            {originalQuantity.toLocaleString()} {originalQuantity === 1 ? "prize" : "prizes"}
          </div>
        )}
      </div>

      <div className={`flex-1 ${gallery ? "text-left" : "text-center"} ${compact ? "p-3" : gallery ? "p-5" : "min-h-[104px] p-6 pb-5"}`}>
        <h3 className={`font-bold leading-tight text-[#142A52] ${compact ? "text-sm" : gallery ? "text-lg tracking-[-0.015em]" : "text-xl"}`}>
          {display.title}
        </h3>
        {display.provider && (
          <>
            <div aria-hidden="true" className={`${gallery ? "w-8" : "mx-auto w-[70%]"} h-px bg-[#C9A44D]/60 ${compact ? "my-2" : "my-3"}`} />
            <p className={`break-words font-semibold ${gallery ? "text-[#61728A]" : "text-[#142A52]"} ${compact ? "text-xs" : gallery ? "text-sm" : "text-lg"}`}>{display.provider}</p>
          </>
        )}
      </div>

      <div className={`flex items-center border-t border-[#DCE7F6] bg-gradient-to-r from-[#F5F8FD] to-[#FFF9E8] ${compact ? "gap-2 px-3 py-2 text-xs" : gallery ? "gap-3 px-5 py-3 text-sm" : "min-h-[73px] gap-3 px-6 py-4"}`}>
          <span className={`flex shrink-0 items-center justify-center rounded-xl bg-[#C9A44D]/15 text-[#9A7421] ${compact ? "h-7 w-7" : "h-10 w-10"}`}>
            <HeartHandshake className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden />
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
