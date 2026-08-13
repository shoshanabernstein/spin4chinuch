"use client";

import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { Lock, CreditCard } from "lucide-react";

export default function StripeCheckout() {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (result.error) {
      setError(result.error.message || "Payment failed.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Payment Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">

          <div className="rounded-xl bg-[#142A52] p-3">
            <CreditCard className="h-5 w-5 text-[#C9A44D]" />
          </div>

          <div>
            <h3 className="font-bold text-[#142A52]">
              Payment Details
            </h3>

            <p className="text-sm text-slate-500">
              Secure checkout powered by Stripe
            </p>
          </div>

        </div>


        {/* Stripe Element */}
        <div className="
          rounded-2xl
          border border-slate-200
          bg-[#FAFAFA]
          p-4
        ">
          <PaymentElement
            options={{
              layout: "accordion",
            }}
          />
        </div>


        {/* Error */}
        {error && (
          <div className="
            mt-4
            rounded-xl
            border border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-600
          ">
            {error}
          </div>
        )}


        {/* Button */}
        <button
          onClick={handlePay}
          disabled={!stripe || !elements || loading}
          className="
            mt-6
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[#142A52]
            py-4
            font-bold
            text-white
            shadow-md
            transition
            hover:bg-[#1E3A6D]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          <Lock className="h-4 w-4 text-[#C9A44D]" />

          {loading ? "Processing Payment..." : "Complete Purchase"}

        </button>

      </div>

    </div>
  );
}