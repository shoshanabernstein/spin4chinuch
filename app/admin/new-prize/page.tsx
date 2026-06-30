"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewPrizePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [probability, setProbability] = useState(1);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  async function savePrize() {
    if (!name.trim()) {
      alert("Please enter a prize name.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("prizes")
      .insert({
        name,
        quantity,
        probability,
        active,
      });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Failed to create prize.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen cy-page flex items-center justify-center p-8">
      <div className="cy-card w-full max-w-xl rounded-3xl p-10">

        <h1 className="text-4xl font-bold text-[#12304a] mb-8">
          🎁 Add Prize
        </h1>

        <div className="space-y-6">

          <div>
            <label className="block mb-2 font-semibold">
              Prize Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cy-input"
              placeholder="Amazon Gift Card"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Quantity
            </label>

            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="cy-input"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Probability
            </label>

            <input
              type="number"
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="cy-input"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />

            <label>Prize is Active</label>
          </div>

          <button
            onClick={savePrize}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#0f8db3] to-[#12304a] text-white py-4 rounded-xl text-xl font-bold hover:scale-105 transition"
          >
            {loading ? "Saving..." : "Save Prize"}
          </button>

        </div>
      </div>
    </main>
  );
}