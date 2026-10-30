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
            disabled={busy || remaining === null || remaining < bundle.spins}
            onClick={() => { setQuantity(bundle.spins); setPackageId(bundle.id); }}
            className={`rounded-xl border px-4 py-5 text-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${packageId === bundle.id ? "border-[#142A52] bg-[#142A52] text-white" : "border-[#E7D7A4] bg-[#FAF7F0] text-[#142A52] hover:border-[#C9A44D]"}`}>
            {bundle.spins} spins &mdash; ${bundle.amount / 100}
          </button>
        ))}
      </div>
    </Panel>
  );
}