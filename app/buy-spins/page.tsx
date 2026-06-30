"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

const packages = [
  { spins: 10, price: "$10", note: "Great for trying your luck.", featured: false },
  { spins: 25, price: "$20", note: "Best value for supporters.", featured: true },
  { spins: 50, price: "$35", note: "Maximum impact and maximum fun.", featured: false },
];

export default function BuySpinsPage() {
  const router = useRouter();
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
        router.push(data.url);
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
    <>
      <Navbar />

      <main className="min-h-screen cy-page">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <Image src="/logo.png" alt="Spin4Chinuch logo" width={180} height={96} className="mx-auto h-24 w-auto" />

            <h1 className="mt-8 text-5xl md:text-6xl font-black text-[#12304a]">
              Buy Spins
            </h1>

            <p className="mt-4 text-xl text-slate-600">
              Every spin helps strengthen Jewish education.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {packages.map((pkg) => (
              <div
                key={pkg.spins}
                className={`relative cy-card rounded-2xl p-8 border-2 border-[#0f8db3]/20 ${pkg.featured ? "md:scale-105 shadow-2xl" : ""}`}
              >
                {pkg.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0f8db3] text-white px-5 py-2 rounded-full font-bold text-sm">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center">
                  <h2 className="text-3xl font-black text-[#12304a]">
                    {pkg.spins} Spins
                  </h2>

                  <p className="text-6xl font-black text-[#0f8db3] mt-4">
                    {pkg.price}
                  </p>

                  <p className="mt-4 text-slate-600">{pkg.note}</p>

                  <button
                    disabled={loading}
                    onClick={() => buySpins(pkg.spins)}
                    className={`w-full mt-8 py-4 rounded-xl text-xl font-bold transition disabled:opacity-50 ${pkg.featured ? "bg-[#0f8db3] text-white hover:opacity-90" : "bg-[#12304a] text-white hover:bg-[#0f8db3]"}`}
                  >
                    {loading ? "Loading..." : "Buy Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 cy-card rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-[#12304a]">
              Spin. Support. Strengthen.
            </h3>

            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Every spin supports Jewish education while giving you the opportunity to win exciting prizes. Thank you for being part of our mission.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
