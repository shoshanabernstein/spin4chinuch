/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Win = { id: string; user_email: string; prize: string; created_at: string; };

export default function WinnersPage() {
  const [wins, setWins] = useState<Win[]>([]);

  const loadWins = useCallback(async () => {
    const { data } = await supabase
      .from("wins")
      .select("*")
      .order("created_at", { ascending: false });

    setWins(data || []);
  }, []);

  useEffect(() => {
    void loadWins();
  }, [loadWins]);

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