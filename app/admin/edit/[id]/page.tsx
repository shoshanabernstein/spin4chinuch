/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditPrizePage() {
  const { id } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [probability, setProbability] = useState(1);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadPrize = useCallback(async () => {
    const { data, error } = await supabase
      .from("prizes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Prize not found");
      router.push("/admin");
      return;
    }

    setName(data.name);
    setQuantity(data.quantity);
    setProbability(data.probability);
    setActive(data.active);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    void loadPrize();
  }, [loadPrize]);

  async function savePrize() {
    const { error } = await supabase
      .from("prizes")
      .update({
        name,
        quantity,
        probability,
        active,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update prize");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen cy-page flex items-center justify-center p-8">
      <div className="cy-card w-full max-w-xl rounded-3xl p-10">

        <h1 className="text-4xl font-bold text-[#12304a] mb-8">
          ✏️ Edit Prize
        </h1>

        <div className="space-y-6">

          <div>
            <label className="font-semibold">Prize Name</label>
            <input
              className="cy-input mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Quantity</label>
            <input
              type="number"
              className="cy-input mt-2"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="font-semibold">Probability</label>
            <input
              type="number"
              className="cy-input mt-2"
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <label>Active</label>
          </div>

          <button
            onClick={savePrize}
            className="w-full bg-[#0f8db3] hover:bg-[#12304a] text-white py-4 rounded-xl text-xl font-bold"
          >
            Save Changes
          </button>

        </div>
      </div>
    </main>
  );
}