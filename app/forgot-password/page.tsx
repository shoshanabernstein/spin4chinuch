"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendReset(e: React.FormEvent) {
  e.preventDefault();

  setLoading(true);

  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo:
        "http://localhost:3000/reset-password",
    }
  );

  setLoading(false);

  if (error) {
    toast.error(error.message);
    return;
  }

  toast.success(
    "Password reset email sent!"
  );
}

return (
  <main className="min-h-screen bg-[#F6F9FD] flex items-center justify-center px-6">

    <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl border">

      <div className="text-center">

        <h1 className="text-4xl font-bold text-[#0D2C6C]">
          Forgot Password
        </h1>

        <p className="mt-3 text-slate-500">
          Enter your email and we'll send you a password reset link.
        </p>

      </div>

      <form
        onSubmit={sendReset}
        className="mt-8 space-y-5"
      >

        <input
          type="email"
          required
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="Email Address"
          className="w-full rounded-xl border border-slate-300 p-3 focus:ring-4 focus:ring-blue-100"
        />

        <button
          disabled={loading}
          className="w-full rounded-full bg-[#0D2C6C] py-3 font-semibold text-white hover:bg-[#17408B]"
        >
          {loading
            ? "Sending..."
            : "Send Reset Link"}
        </button>

      </form>

      <div className="mt-8 text-center">

        <Link
          href="/login"
          className="font-semibold text-[#0D2C6C] hover:underline"
        >
          ← Back to Login
        </Link>

      </div>

    </div>

  </main>
);
}