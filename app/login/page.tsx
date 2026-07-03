"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirect") || "/dashboard";

  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [authLoading, user, router, redirectTo]);

  async function signIn(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    setLoading(false);

    if (error) {
      switch (error.message) {
        case "Invalid login credentials":
          toast.error("Incorrect email or password.");
          break;

        case "Email not confirmed":
          toast.error(
            "Please verify your email before logging in."
          );
          break;

        default:
          toast.error(error.message);
      }

      return;
    }

    toast.success("Welcome back!");

    router.replace(redirectTo);
  }

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F9FD]">
        <Loader2
          className="animate-spin text-[#0D2C6C]"
          size={42}
        />
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-[#F6F9FD] flex items-center justify-center px-6 py-20">

    <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-10">

      {/* Logo / Header */}

      <div className="text-center mb-8">

        <img
          src="/navbar_logo.png"
          alt="Spin4Chinuch"
          className="mx-auto h-16 w-auto mb-4"
        />

        <h1 className="text-4xl font-bold text-[#0D2C6C]">
          Welcome Back
        </h1>

        <p className="mt-2 text-slate-500">
          Sign in to your Spin4Chinuch account
        </p>

      </div>

      {/* Form */}

      <form onSubmit={signIn} className="space-y-5">

        {/* Email */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Email Address
          </label>

          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#0D2C6C] focus:ring-4 focus:ring-blue-100"
            placeholder="you@example.com"
            autoFocus
          />
        </div>

        {/* Password */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Password
          </label>

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-[#0D2C6C] focus:ring-4 focus:ring-blue-100"
              placeholder="Enter your password"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0D2C6C]"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>

          </div>
        </div>

        {/* Forgot Password */}

        <div className="flex justify-end">

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#0D2C6C] hover:underline"
          >
            Forgot Password?
          </Link>

        </div>

        {/* Login Button */}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#0D2C6C] py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-[#17408B] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Signing In...
            </>
          ) : (
            "Login"
          )}
        </button>

      </form>

      {/* Divider */}

      <div className="my-8 flex items-center">

        <div className="flex-1 border-t border-slate-200"></div>

        <span className="px-4 text-sm text-slate-400">
          OR
        </span>

        <div className="flex-1 border-t border-slate-200"></div>

      </div>

      {/* Create Account */}

      <Link
        href="/signup"
        className="block w-full rounded-full border-2 border-[#0D2C6C] py-3 text-center font-semibold text-[#0D2C6C] transition hover:bg-[#0D2C6C] hover:text-white"
      >
        Create Account
      </Link>

    </div>

  </main>
);
}