"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";

const packages = [
  { spins: 10, price: "$10", note: "Great for trying your luck.", featured: false },
  { spins: 25, price: "$20", note: "Best value for supporters.", featured: true },
  { spins: 50, price: "$35", note: "Maximum impact and maximum fun.", featured: false },
];

export default function BuySpinsPage() {
  const [loading, setLoading] = useState(false);

  async function buySpins(spins: number) {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!user || !session) {
        alert("Please log in first");
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ spins }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error(data);
        alert("Unable to start checkout");
      }
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <>
        <Navbar />

        <main className="min-h-screen bg-[#faf7f0] pt-24">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center">
              <img src="/logo.png" alt="Spin4Chinuch" className="h-24 mx-auto" />

              <h1 className="mt-8 text-5xl md:text-6xl font-black text-[#142A52]">
                Buy Spins
              </h1>

              <p className="mt-4 text-xl text-gray-600">
                Every spin helps strengthen Jewish education.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-16">
              {packages.map((pkg) => (
                <div
                  key={pkg.spins}
                  className={`relative bg-white rounded-2xl shadow-xl p-8 border-4 border-[#C9A44D] ${pkg.featured ? "md:scale-105 shadow-2xl" : ""}`}
                >
                  {pkg.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C9A44D] text-white px-5 py-2 rounded-full font-bold text-sm">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="text-center">
                    <h2 className="text-3xl font-black text-[#142A52]">
                      {pkg.spins} Spins
                    </h2>

                    <p className="text-6xl font-black text-[#C9A44D] mt-4">
                      {pkg.price}
                    </p>

                    <p className="mt-4 text-gray-600">{pkg.note}</p>

                    <button
                      disabled={loading}
                      onClick={() => buySpins(pkg.spins)}
                      className={`w-full mt-8 py-4 rounded-xl text-xl font-bold transition disabled:opacity-50 ${pkg.featured ? "bg-[#C9A44D] text-white hover:opacity-90" : "bg-[#142A52] text-white hover:bg-[#1d3d77]"}`}
                    >
                      {loading ? "Loading..." : "Buy Now"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-[#142A52]">
                Spin. Support. Strengthen.
              </h3>

              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Every spin supports Jewish education while giving you the opportunity to win exciting prizes. Thank you for being part of our mission.
              </p>
            </div>
          </div>
        </main>
      </>
    </ProtectedRoute>
  );
}
