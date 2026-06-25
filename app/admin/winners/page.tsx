"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function WinnersPage() {
  const [wins, setWins] = useState<any[]>([]);

  useEffect(() => {
    loadWins();
  }, []);

  async function loadWins() {
    const { data } = await supabase
      .from("wins")
      .select("*")
      .order("created_at", { ascending: false });

    setWins(data || []);
  }

  return (
    <main className="min-h-screen bg-blue-50 p-10">
      <h1 className="text-5xl font-bold mb-8">
        Winners
      </h1>

      <div className="bg-white rounded-2xl shadow p-6">
        {wins.map((win) => (
          <div
            key={win.id}
            className="border-b py-4"
          >
            <p className="font-bold">
              {win.user_email}
            </p>

            <p>{win.prize}</p>

            <p className="text-sm text-gray-500">
              {new Date(win.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}