"use client";

import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
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
  sponsor_name: string | null;
}

export default function BuySpinsPage() {
  const PRICE_PER_SPIN = 18;

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const [prizes, setPrizes] = useState<Prize[]>([]);

  const [clientSecret, setClientSecret] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const total = quantity * PRICE_PER_SPIN;

  useEffect(() => {
    async function fetchPrizes() {
      const { data, error } = await supabase
        .from("prizes")
        .select("*")
        .eq("active", true)
        .order("id", { ascending: true });

      if (!error) {
        setPrizes(data || []);
      }
    }

    fetchPrizes();
  }, []);

  async function startCheckout() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first.");
        return;
      }

      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!data.clientSecret) {
        throw new Error("Missing client secret");
      }

      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } catch (err) {
      console.error(err);
      alert("Unable to start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">

        {/* Background (matches Dashboard) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
        </div>

        <Navbar />

        <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 space-y-10">

          {/* Hero */}
          <BuySpinsHero />

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
              onStartCheckout={startCheckout}
            />
          </section>

          {/* Prize Carousel */}
          <section id="prizes">
            <PrizeCarousel prizes={prizes} />
          </section>

        </main>

        {/* Stripe Drawer */}
        {showPayment && clientSecret && (
          <div className="fixed inset-0 z-50 flex">

            {/* Overlay */}
            <div
              onClick={() => setShowPayment(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Drawer */}
            <div className="relative ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">

              <div className="border-b p-6">

                <h2 className="text-3xl font-black text-[#142A52]">
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