"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [spins, setSpins] = useState(0);

  useEffect(() => {

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("spins_remaining")
        .eq("id", user.id)
        .single();

      if (profile) {
        setSpins(profile.spins_remaining);
      }
    }

    loadUser();
  }, []);

  return (
    <main className="min-h-screen bg-blue-50 p-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-5xl font-bold mb-8">
          Dashboard
        </h1>

        <div className="bg-white rounded-3xl p-8 shadow-lg">

          <h2 className="text-2xl font-bold">
            Welcome
          </h2>

          <p className="mt-2 text-gray-600">
            {email}
          </p>

          <p className="mt-6 text-gray-600">
            Available Spins
          </p>

          <p className="text-6xl font-bold text-blue-600">
            {spins}
          </p>

          <div className="flex gap-4 mt-8">
            <button className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700">
              <Link
                href="/buy-spins"
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700"
              >
                Buy 10 Spins - $10
              </Link>
            </button>

            <button className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700">

              <Link
                href="/spin"
                className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700"
              >
                Spin Wheel
              </Link>
            </button>
          </div>

        </div>

      </div>
    </main>
  );
}