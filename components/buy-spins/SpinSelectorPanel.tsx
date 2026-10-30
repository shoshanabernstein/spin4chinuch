"use client";

import Panel from "@/components/ui/Panel";
import QuantitySelector from "./QuantitySelector";
import { Check, Ticket } from "lucide-react";
import { SPIN_PACKAGES, type SpinPackageId } from "@/lib/spin-pricing";

interface SpinSelectorPanelProps {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  packageId: SpinPackageId;
  setPackageId: (value: SpinPackageId) => void;
  remaining: number | null;
  busy: boolean;
}

export default function SpinSelectorPanel({ quantity, setQuantity, packageId, setPackageId, remaining, busy }: SpinSelectorPanelProps) {
  return (
    <Panel title="" subtitle="">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7C96D] text-[#102A52]"><Ticket size={26} /></div>
        <div><h2 className="text-3xl font-bold tracking-tight text-[#142A52]">Choose your spins</h2><p className="mt-1 text-sm text-slate-500">Buy more. Save more. Support Chinuch.</p></div>
      </div>
      <div role="group" aria-label="Discounted spin packages" className="grid grid-cols-3 gap-2 sm:gap-3">
        {SPIN_PACKAGES.map(bundle => {
          const selected = packageId === bundle.id;
          const unavailable = remaining !== null && remaining < bundle.spins;
          return (
            <button key={bundle.id} type="button" aria-pressed={selected} disabled={busy || remaining === null || unavailable}
              onClick={() => { setQuantity(bundle.spins); setPackageId(bundle.id); }}
              className={`relative rounded-2xl border-2 px-2 py-5 text-center transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 ${selected ? "border-[#102A52] bg-[#102A52] text-white shadow-md" : "border-[#DBE2E9] bg-[#FAF8F3] text-[#102A52] hover:border-[#649CD3]"}`}>
              <span className={`mb-3 block text-[10px] font-bold uppercase tracking-wider ${selected ? "text-[#E7C96D]" : "text-[#527CA4]"}`}>{bundle.spins === 10 ? "Best value" : "Spin package"}</span>
              <span className="block text-3xl font-bold sm:text-4xl">{bundle.spins}</span>
              <span className={`mt-1 block text-xs ${selected ? "text-blue-100" : "text-slate-500"}`}>spins</span>
              <span className="mt-4 block text-2xl font-bold">${bundle.amount / 100}</span>
              <span className={`mt-2 block text-xs font-semibold ${selected ? "text-[#E7C96D]" : "text-[#467EB3]"}`}>Save ${bundle.spins * 18 - bundle.amount / 100}</span>
              <span className="mt-4 flex h-5 items-center justify-center">{selected ? <Check size={18} aria-hidden="true" /> : <span className="text-[11px]">{unavailable ? "Unavailable" : "Select"}</span>}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 border-t border-slate-200 pt-5">
        <button type="button" disabled={busy} aria-pressed={packageId === "individual"} onClick={() => { setPackageId("individual"); setQuantity(1); }} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition disabled:opacity-50 ${packageId === "individual" ? "border-[#649CD3] bg-[#EDF3F8]" : "border-slate-200 hover:bg-slate-50"}`}>
          <span className="font-semibold text-[#142A52]">Individual spins <span className="ml-1 text-sm font-normal text-slate-500">$18 each</span></span>
          {packageId === "individual" && <Check size={18} className="text-[#467EB3]" aria-hidden="true" />}
        </button>
        {packageId === "individual" && <QuantitySelector quantity={quantity} setQuantity={setQuantity} disabled={busy} />}
      </div>
    </Panel>
  );
}
