"use client";

import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { CreditCard } from "lucide-react";

interface OrderSummaryProps {
  quantity: number;
  total: number;
  subtotal?: number;
  discount?: number;
  discountBalance?: number;
  loading: boolean;
  purchaseBlockedLabel?: string;
  onStartCheckout: () => void;
}

export default function OrderSummary({
  quantity,
  total,
  subtotal = total,
  discount = 0,
  discountBalance = discount,
  loading,
  purchaseBlockedLabel,
  onStartCheckout,
}: OrderSummaryProps) {
  const average = (subtotal / quantity).toFixed(2);
  const savings = quantity * 18 - subtotal;

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
              Spins
            </span>

            <span className="font-semibold">
              {quantity}
            </span>

          </div>

          <div className="mt-4 flex items-center justify-between">

            <span className="text-slate-500">
              Average per spin
            </span>

            <span className="font-semibold">
              ${average}
            </span>

          </div>

          {savings > 0 && <div className="mt-4 flex items-center justify-between font-semibold text-[#467EB3]"><span>Package savings</span><span>${savings}</span></div>}

          {discount > 0 && <div className="mt-4 flex items-center justify-between font-semibold text-[#467EB3]"><span>Your discount</span><span>-${discount.toFixed(2)}</span></div>}
          {discountBalance > discount && <p className="mt-3 text-sm text-slate-500">${(discountBalance - discount).toFixed(2)} remains for a future purchase.</p>}
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
          disabled={loading || Boolean(purchaseBlockedLabel) || quantity < 1}
          variant="gold"
          className="w-full py-4 text-lg"
        >
          <CreditCard size={20} />

          {purchaseBlockedLabel || (loading
            ? "Preparing Checkout..."
            : total === 0 ? "Complete free purchase" : "Continue to Checkout")}
        </Button>

        <p className="text-center text-sm text-slate-500">
          🔒 Payments are securely processed by Stripe.
        </p>

      </div>
    </Panel>
  );
}
