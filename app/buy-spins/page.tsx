"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useSpinAvailability } from "@/components/useSpinAvailability";
import { supabase } from "@/lib/supabase";
import BuySpinsHero from "@/components/buy-spins/BuySpinsHero";
import SpinSelectorPanel from "@/components/buy-spins/SpinSelectorPanel";
import OrderSummary from "@/components/buy-spins/OrderSummary";
import PrizeCarousel from "@/components/buy-spins/PrizeCarousel";
import StripeCheckout from "@/components/buy-spins/StripeCheckout";
import StripeProvider from "@/components/StripeProvider";

interface Prize {
  id: number;
  name: string;
  image_url: string | null;
  retail_value: number | null;
  quantity: number;
  original_quantity?: number | null;
  sponsor_name: string | null;
}

export default function BuySpinsPage() {
  const sales = useSpinAvailability();
  const PRICE_PER_SPIN = 18;

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const [prizes, setPrizes] = useState<Prize[]>([]);

  const [clientSecret, setClientSecret] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const total = quantity * PRICE_PER_SPIN;

  useEffect(() => {
    async function fetchPrizes() {
      try {
        const response = await fetch("/api/prizes", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load prizes");
        const data = await response.json();
        setPrizes(data.prizes.filter((prize: Prize) => prize.quantity > 0));
      } catch {
        toast.error("Prizes are temporarily unavailable. Please try again shortly.");
      }
    }

    fetchPrizes();
  }, []);

  useEffect(() => {
    if (!showPayment) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowPayment(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showPayment]);

  async function startCheckout() {
    setLoading(true);

    try {
      const available = await sales.check();
      if (available === null) throw new Error("Unable to check availability. Please try again.");
      if (available === 0) throw new Error("All 1,100 spins have been sold.");
      if (quantity > available) throw new Error(`Only ${available} spins remain.`);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!user || !session) {
        throw new Error("Please log in again before checking out.");
        return;
      }

      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unable to start checkout.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="app-page">

        {/* Background (matches Dashboard) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
        </div>

        <div className="app-container">

          {/* Hero */}
          <BuySpinsHero />
          {sales.remaining === 0 && <p role="status" className="rounded-2xl bg-[#142A52] p-5 text-center font-bold text-white">Sold out — all 1,100 spins have been purchased.</p>}
          {sales.unavailable && <p role="status" className="p-4 text-center">Spin sales are temporarily unavailable. Please try again shortly.</p>}

          {/* Purchase Section */}
          <section
            id="purchase"
            className="grid gap-6 lg:grid-cols-2"
          >
            <SpinSelectorPanel
              quantity={quantity}
              setQuantity={setQuantity}
            />

            <OrderSummary
              quantity={quantity}
              setQuantity={setQuantity}
              total={total}
              loading={loading}
              purchaseBlockedLabel={sales.remaining === 0 ? "Sold out" : sales.remaining === null ? (sales.unavailable ? "Sales unavailable" : "Checking availability…") : quantity > sales.remaining ? `Only ${sales.remaining} spins remain` : undefined}
              onStartCheckout={startCheckout}
            />
          </section>

          {/* Prize Carousel */}
          <section id="prizes">
            <PrizeCarousel prizes={prizes} />
          </section>

        </div>

        {/* Stripe Drawer */}
        {showPayment && clientSecret && (
          <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="checkout-title">

            {/* Overlay */}
            <div
              onClick={() => setShowPayment(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Drawer */}
            <div className="relative ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">

              <div className="border-b p-6">

                <button
                  type="button"
                  onClick={() => setShowPayment(false)}
                  aria-label="Close checkout"
                  className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>

                <h2 id="checkout-title" className="pr-12 text-3xl font-black text-[#142A52]">
                  Secure Checkout
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Complete your purchase securely with Stripe.
                </p>

              </div>

              <div className="flex-1 overflow-y-auto p-6">

                <div className="mb-6 rounded-2xl border border-slate-200 bg-[#FAF7F0] p-5">

                  <div className="flex justify-between">

                    <span className="text-slate-500">
                      Spins
                    </span>

                    <span className="font-bold">
                      {quantity}
                    </span>

                  </div>

                  <div className="mt-3 flex justify-between">

                    <span className="text-slate-500">
                      Total
                    </span>

                    <span className="text-2xl font-black text-[#C9A44D]">
                      ${total}
                    </span>

                  </div>

                </div>

                <StripeProvider
                  key={clientSecret}
                  clientSecret={clientSecret}
                >
                  <StripeCheckout />
                </StripeProvider>

              </div>

            </div>

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
