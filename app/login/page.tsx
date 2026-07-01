"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function signUp() {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        spins: 0,
        spins_remaining: 0,
      });

      if (profileError) {
        console.log(profileError);
      }
    }

    alert("Account created!");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <>
      <main className="cy-page flex items-center justify-center px-6 py-14">
        <div className="cy-card w-full max-w-md rounded-[2rem] p-8 md:p-10">
          <Image src="/logo.png" alt="Spin4Chinuch logo" width={180} height={96} className="mx-auto h-20 w-auto" />
          <p className="cy-kicker mt-8 text-center">Supporter portal</p>
          <h1 className="cy-heading mt-3 text-center text-4xl">Welcome back</h1>
          <p className="mt-3 text-center leading-7 text-slate-600">
            Sign in to buy spins, track wins, and keep supporting Chinuch Yehudi USA.
          </p>

          <div className="mt-8 space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="cy-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="cy-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button onClick={signIn} className="cy-button-primary w-full">
              Login
            </button>

            <button onClick={signUp} className="cy-button-secondary w-full bg-white/60">
              Create Account
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
