"use client";

import { useState } from "react";

export default function BuySpinsPage() {

  const [loading, setLoading] = useState(false);

  async function buySpins(spins:number) {

    setLoading(true);

    try {

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spins,
        }),
      });


      const data = await res.json();


      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Stripe error");
      }


    } catch (error) {

      console.log(error);
      alert("Payment failed");

    } finally {

      setLoading(false);

    }
  }


  return (

    <main className="min-h-screen bg-blue-50 p-10">


      <h1 className="text-5xl font-bold mb-10">
        Buy Spins
      </h1>


      <div className="grid gap-6 max-w-xl">


        <button
          disabled={loading}
          onClick={() => buySpins(10)}
          className="bg-green-600 text-white p-6 rounded-2xl text-2xl"
        >
          {loading ? "Loading..." : "10 Spins - $10"}
        </button>



        <button
          disabled={loading}
          onClick={() => buySpins(25)}
          className="bg-blue-600 text-white p-6 rounded-2xl text-2xl"
        >
          {loading ? "Loading..." : "25 Spins - $20"}
        </button>



        <button
          disabled={loading}
          onClick={() => buySpins(50)}
          className="bg-purple-600 text-white p-6 rounded-2xl text-2xl"
        >
          {loading ? "Loading..." : "50 Spins - $35"}
        </button>


      </div>


    </main>

  );
}