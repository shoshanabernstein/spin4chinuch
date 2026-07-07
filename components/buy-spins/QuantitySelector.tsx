"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
}

export default function QuantitySelector({
  quantity,
  setQuantity,
}: QuantitySelectorProps) {
  function decrease() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increase() {
    setQuantity((prev) => prev + 1);
  }

  return (
    <div className="flex flex-col items-center">

      {/* Selector */}
      <div className="mt-10 flex items-center gap-8">

        {/* Minus */}
        <button
          type="button"
          onClick={decrease}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FF] text-[#4267A8] shadow transition-all duration-200 hover:scale-105 hover:bg-[#4267A8] hover:text-white active:scale-95"
        >
          <Minus size={22} />
        </button>

        {/* Ticket */}
        <div className="relative flex h-40 w-40 flex-col items-center justify-center rounded-[32px] border border-[#F1DEAE] bg-gradient-to-br from-[#FFFDF6] to-[#FFF4D8] shadow-lg">

          <div
            key={quantity}
            className="text-6xl font-black leading-none text-[#142A52]"
          >
            {quantity}
          </div>

          <p className="mt-3 text-sm font-bold uppercase tracking-[0.25em] text-[#C9A44D]">
            {quantity === 1 ? "Spin" : "Spins"}
          </p>

        </div>

        {/* Plus */}
        <button
          type="button"
          onClick={increase}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A44D] text-white shadow transition-all duration-200 hover:scale-105 hover:brightness-105 active:scale-95"
        >
          <Plus size={22} />
        </button>

      </div>

    </div>
  );
}