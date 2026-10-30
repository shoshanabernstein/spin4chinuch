"use client";

import Panel from "@/components/ui/Panel";
import QuantitySelector from "./QuantitySelector";
import { SPIN_PACKAGES, type SpinPackageId } from "@/lib/spin-pricing";
import { Ticket } from "lucide-react";

interface SpinSelectorPanelProps {
  packageId: SpinPackageId;
  setPackageId: (value: SpinPackageId) => void;
  remaining: number | null;
  busy: boolean;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
}

export default function SpinSelectorPanel({
  quantity,
  setQuantity,
  packageId,
  setPackageId,
  remaining,
  busy,
}: SpinSelectorPanelProps) {
  return (
    <Panel
      title=""
      subtitle=""
    >
      <div className="mb-4 flex items-center gap-3">

        <div className="flex h-10 w-14 items-center justify-center rounded-2xl bg-[#C9A44D] text-white shadow-md">
          <Ticket size={26} />
        </div>

        <div>

          <h2 className="text-3xl font-black text-[#142A52]">
            Get Your Spins
          </h2>

        </div>

      </div>

      <QuantitySelector
        quantity={quantity}
        disabled={busy}
        setQuantity={(value) => {
          setQuantity(typeof value === "function" ? value(quantity) : value);
          setPackageId("individual");
        }}
      />
      <div role="group" aria-label="Discounted spin packages" className="mt-8 grid grid-cols-2 gap-3 border-t border-slate-200 pt-6">
        {SPIN_PACKAGES.map(bundle => (
          <button key={bundle.id} type="button" aria-pressed={packageId === bundle.id}
            aria-label={`${bundle.spins} spins for $${bundle.amount / 100}`}
            disabled={busy || remaining === null || remaining < bundle.spins}
            onClick={() => { setQuantity(bundle.spins); setPackageId(bundle.id); }}
            className={`group relative isolate flex items-center justify-between gap-2 overflow-hidden rounded-2xl border px-2.5 py-5 text-left shadow-md transition duration-200 motion-safe:hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A44D] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:px-7 sm:py-6 ${packageId === bundle.id ? "border-[#C9A44D] bg-gradient-to-br from-[#F8E5A3] via-[#E7C96D] to-[#D7AF4F] text-[#142A52] shadow-[#C9A44D]/20" : "border-[#365881] bg-gradient-to-br from-[#234F80] via-[#17375E] to-[#102A52] text-white hover:border-[#E7C96D] hover:shadow-lg"}`}>
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <span className={`absolute -right-10 -top-16 h-40 w-48 -rotate-[28deg] rounded-[50%] border-[10px] ${packageId === bundle.id ? "border-[#102A52]/[0.05]" : "border-[#8DB9F4]/[0.08]"}`} />
              <span className={`absolute -right-8 -top-12 h-40 w-48 -rotate-[28deg] rounded-[50%] border ${packageId === bundle.id ? "border-[#102A52]/15" : "border-[#E7C96D]/25"}`} />
              <Ticket className={`absolute -bottom-4 right-2 h-20 w-20 -rotate-[25deg] ${packageId === bundle.id ? "text-[#102A52]/[0.06]" : "text-[#9FC5E7]/[0.08]"}`} strokeWidth={1} />
            </span>
            <span aria-hidden="true" className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white" />
            <span aria-hidden="true" className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white" />
            <span className="relative flex flex-col gap-1">
              <span className="text-3xl font-black leading-none sm:text-4xl">{bundle.spins}</span>
              <span className={`text-[9px] font-bold uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em] ${packageId === bundle.id ? "text-[#365477]" : "text-[#BFD7EF]"}`}>spins</span>
            </span>
            <span className={`relative border-l border-dashed pl-2 text-2xl font-black leading-none tracking-tight sm:pl-6 sm:text-4xl ${packageId === bundle.id ? "border-[#102A52]/25 text-[#142A52]" : "border-[#E7C96D]/35 text-[#F4D984]"}`}>${bundle.amount / 100}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}
