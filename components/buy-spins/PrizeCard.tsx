/* eslint-disable @next/next/no-img-element */
import Card from "@/components/ui/Card";

interface PrizeCardProps {
  name: string;
  imageUrl: string;
  retailValue: number | null;
  sponsorName?: string | null;
}

export default function PrizeCard({
  name,
  imageUrl,
  retailValue,
  sponsorName,
}: PrizeCardProps) {
  return (
    <Card
      className="
        group overflow-hidden rounded-3xl
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
        <img
          src={imageUrl}
          alt={name}
          className="
            h-full w-full object-cover
            transition-transform duration-500
            group-hover:scale-110
          "
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Retail Value */}
        {retailValue !== null && (
          <div className="absolute top-4 right-4 rounded-full bg-[#C9A44D] px-4 py-2 text-sm font-bold text-white shadow-lg">
            ${retailValue.toLocaleString()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4 p-6">
        <h3 className="min-h-[56px] text-xl font-bold leading-tight text-[#142A52]">
          {name}
        </h3>

        {sponsorName && (
          <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            Sponsored by{" "}
            <span className="ml-1 font-semibold text-slate-800">
              {sponsorName}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
