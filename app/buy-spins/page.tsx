"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BuySpinsPage() {
  const [loading, setLoading] = useState(false);

  async function buySpins(spins: number) {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first");
        return;
      }

      const res = await fetch(
        "/api/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            spins,
            userId: user.id,
          }),
        }
      );

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
    <main className="min-h-screen bg-[#faf7f0]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-24 mx-auto"
          />

          <h1 className="mt-8 text-6xl font-black text-[#142A52]">
            Buy Spins
          </h1>

          <p className="mt-4 text-xl text-gray-600">
            Every spin helps strengthen Jewish education.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {/* 10 Spins */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-[#C9A44D]">
            <div className="text-center">
              <h2 className="text-3xl font-black text-[#142A52]">
                10 Spins
              </h2>

              <p className="text-6xl font-black text-[#C9A44D] mt-4">
                $10
              </p>

              <p className="mt-4 text-gray-600">
                Great for trying your luck.
              </p>

              <button
                disabled={loading}
                onClick={() => buySpins(10)}
                className="w-full mt-8 bg-[#142A52] text-white py-4 rounded-xl text-xl font-bold hover:bg-[#1d3d77] transition"
              >
                {loading ? "Loading..." : "Buy Now"}
              </button>
            </div>
          </div>

          {/* 25 Spins */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-[#C9A44D] scale-105 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C9A44D] text-white px-5 py-2 rounded-full font-bold">
              MOST POPULAR
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-black text-[#142A52]">
                25 Spins
              </h2>

              <p className="text-6xl font-black text-[#C9A44D] mt-4">
                $20
              </p>

              <p className="mt-4 text-gray-600">
                Best value for supporters.
              </p>

              <button
                disabled={loading}
                onClick={() => buySpins(25)}
                className="w-full mt-8 bg-[#C9A44D] text-white py-4 rounded-xl text-xl font-bold hover:opacity-90 transition"
              >
                {loading ? "Loading..." : "Buy Now"}
              </button>
            </div>
          </div>

          {/* 50 Spins */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-[#C9A44D]">
            <div className="text-center">
              <h2 className="text-3xl font-black text-[#142A52]">
                50 Spins
              </h2>

              <p className="text-6xl font-black text-[#C9A44D] mt-4">
                $35
              </p>

              <p className="mt-4 text-gray-600">
                Maximum impact and maximum fun.
              </p>

              <button
                disabled={loading}
                onClick={() => buySpins(50)}
                className="w-full mt-8 bg-[#142A52] text-white py-4 rounded-xl text-xl font-bold hover:bg-[#1d3d77] transition"
              >
                {loading ? "Loading..." : "Buy Now"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-3xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-[#142A52]">
            Spin. Support. Strengthen.
          </h3>

          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Every spin supports Jewish education while giving you the
            opportunity to win exciting prizes. Thank you for being part
            of our mission.
          </p>
        </div>
      </div>
    </main>
  );
}