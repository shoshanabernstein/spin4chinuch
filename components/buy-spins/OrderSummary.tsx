"use client";

import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { CreditCard } from "lucide-react";

interface OrderSummaryProps {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  loading: boolean;
  onStartCheckout: () => void;
}

export default function OrderSummary({
  quantity,
  total,
  loading,
  onStartCheckout,
}: OrderSummaryProps) {
  const PRICE_PER_SPIN = 18;

  return (
    <Panel
      title="Order Summary"
      subtitle=""
    >
      <div className="space-y-6">

        {/* Summary */}
        <div className="rounded-3xl border border-slate-200 bg-[#FAF7F0] p-6">

          <div className="flex items-center justify-between">

             <span className="text-slate-500">
              Total
            </span>

            <span className="font-semibold">
              ${total}
            </span>

          </div>

          <div className="mt-4 flex items-center justify-between">

            <span className="text-slate-500">
              Price per Spin
            </span>

            <span className="font-semibold">
              ${PRICE_PER_SPIN}
            </span>

          </div>

          <div className="my-5 border-t border-slate-200" />

          <div className="flex items-center justify-between">

            <span className="text-lg font-bold text-[#142A52]">
              Donation Amount
            </span>

            <span className="text-4xl font-black text-[#C9A44D]">
              ${total}
            </span>

          </div>

        </div>
        
        {/* Checkout */}

        <Button
          onClick={onStartCheckout}
          disabled={loading || quantity < 1}
          variant="gold"
          className="w-full py-4 text-lg"
        >
          <CreditCard size={20} />

          {loading
            ? "Preparing Checkout..."
            : " Continue to Secure Checkout"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          🔒 Payments are securely processed by Stripe.
        </p>

      </div>
    </Panel>
  );
}
