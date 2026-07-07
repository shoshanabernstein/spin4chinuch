"use client";

import Panel from "@/components/ui/Panel";
import QuantitySelector from "./QuantitySelector";
import { Ticket } from "lucide-react";

interface SpinSelectorPanelProps {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
}

export default function SpinSelectorPanel({
  quantity,
  setQuantity,
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
        setQuantity={setQuantity}
      />
    </Panel>
  );
}