"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);

  async function addPrize() {
    if (!name) return;

    await supabase.from("prizes").insert({
      name,
      quantity,
      active: false,
    });

    setName("");
    setQuantity(1);

    loadPrizes();
  }

  async function toggleActive(id: number, active: boolean) {
    await supabase
      .from("prizes")
      .update({
        active: !active,
      })
      .eq("id", id);

    loadPrizes();
  }

  async function deletePrize(id: number) {
    await supabase
      .from("prizes")
      .delete()
      .eq("id", id);

    loadPrizes();
  }

  useEffect(() => {
    loadPrizes();
  }, []);

  async function loadPrizes() {
    const { data, error } = await supabase
      .from("prizes")
      .select("*")
      .eq("active", false)
      .gt("quantity", 0);
        
      console.log("DATA:", data);
      console.log("ERROR:", error);


    setPrizes(data || []);
  }

  const activeCount = prizes.filter(
    (p) => !p.active
  ).length;

  return (
    <main className="min-h-screen bg-blue-50 p-10">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-5xl font-bold mb-8">
          Admin Dashboard
        </h1>

        <div className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500">
              Total Prizes
            </p>
            <h2 className="text-4xl font-bold">
              {prizes.length}
            </h2>
          </div>

          <div className="bg-green-100 rounded-2xl p-6 shadow">
            <p>Active</p>
            <h2 className="text-4xl font-bold">
              {activeCount}
            </h2>
          </div>

          <div className="bg-red-100 rounded-2xl p-6 shadow">
            <p>Active</p>
            <h2 className="text-4xl font-bold">
              {activeCount}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-2xl p-6 shadow mb-10">

          <h2 className="text-2xl font-bold mb-4">
            Add Prize
          </h2>

          <div className="flex gap-4">

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Prize Name"
              className="border p-3 rounded-lg flex-1"
            />

            <input
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(Number(e.target.value))
              }
              className="border p-3 rounded-lg w-32"
            />

            <button
              onClick={addPrize}
              className="bg-green-600 text-white px-6 rounded-lg"
            >
              Add
            </button>

          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {prizes.map((prize) => (
            <div
              key={prize.id}
              className="bg-white rounded-2xl p-6 shadow"
            >
              <div className="flex justify-between">

                <h2 className="text-2xl font-bold">
                  {prize.name}
                </h2>

                <span
                  className={`px-3 py-1 rounded-full text-sm ${prize.active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                    }`}
                >
                  {prize.active
                    ? "Active"
                    : "Inactive "}
                </span>

              </div>

              <p className="mt-4 text-gray-600">
                Quantity Remaining:
              </p>

              <p className="text-3xl font-bold">
                {prize.quantity}
              </p>

              <div className="flex gap-3 mt-6">

                <button
                  onClick={() =>
                    toggleActive(
                      prize.id,
                      prize.active
                    )
                  }
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                >
                  {prize.active
                    ? "Deactivate"
                    : "Activate"}
                </button>

                <button
                  onClick={() =>
                    deletePrize(prize.id)
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Delete
                </button>

              </div>
            </div>
          ))}

        </div>

      </div>
    </main>
  );
}