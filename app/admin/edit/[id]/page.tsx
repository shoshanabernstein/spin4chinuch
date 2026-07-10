"use client";
/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditPrizePage() {
  const { id } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrize();
  }, []);

  async function loadPrize() {
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
    setActive(data.active);
    setLoading(false);
  }

  async function savePrize() {
    const { error } = await supabase
      .from("prizes")
      .update({
        name,
        quantity,
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-8">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-10">

        <h1 className="text-4xl font-bold text-blue-700 mb-8">
          ✏️ Edit Prize
        </h1>

        <div className="space-y-6">

          <div>
            <label className="font-semibold">Prize Name</label>
            <input
              className="w-full border rounded-xl p-4 mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Quantity</label>
            <input
              type="number"
              className="w-full border rounded-xl p-4 mt-2"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-xl font-bold"
          >
            Save Changes
          </button>

        </div>
      </div>
    </main>
  );
}
