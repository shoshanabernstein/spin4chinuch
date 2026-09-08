/* eslint-disable @next/next/no-img-element */
import { Gift, HeartHandshake } from "lucide-react";
import Card from "@/components/ui/Card";

interface PrizeCardProps {
  name: string;
  imageUrl?: string | null;
  quantity: number;
  sponsorName?: string | null;
}

export default function PrizeCard({
  name,
  imageUrl,
  quantity,
  sponsorName,
}: PrizeCardProps) {
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
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
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

        {/* Prize quantity */}
        <div className="absolute top-4 right-4 rounded-full bg-[#C9A44D] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {quantity.toLocaleString()} {quantity === 1 ? "prize" : "prizes"}
        </div>
      </div>

      <div className="flex min-h-[104px] flex-1 items-start p-6 pb-5">
        <h3 className="line-clamp-3 text-xl font-bold leading-tight text-[#142A52]">
          {name}
        </h3>
      </div>

      <div className="flex min-h-[73px] items-center gap-3 border-t border-[#DCE7F6] bg-gradient-to-r from-[#F5F8FD] to-[#FFF9E8] px-6 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A44D]/15 text-[#9A7421]">
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B7F9E]">
              Prize sponsor
            </p>
            <p className="mt-0.5 truncate font-bold text-[#142A52]">
              {sponsorName || "Sponsor details coming soon"}
            </p>
          </div>
        </div>
    </Card>
  );
}
