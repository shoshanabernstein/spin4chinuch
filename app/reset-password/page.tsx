"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { ClipLoader } from "react-spinners";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

function getStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 2)
    return {
      text: "Weak",
      color: "bg-red-500",
      width: "33%",
      checks,
    };

  if (score <= 4)
    return {
      text: "Good",
      color: "bg-yellow-500",
      width: "66%",
      checks,
    };

  return {
    text: "Strong",
    color: "bg-green-500",
    width: "100%",
    checks,
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    const valid =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!valid) {
      toast.error("Please choose a stronger password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated!");

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-[#F6F9FD] flex items-center justify-center px-6 py-20">

      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-[0_20px_60px_rgba(13,44,108,0.15)] p-10">

        <Image
          src="/navbar_logo.png"
          alt="Spin4Chinuch"
          width={220}
          height={70}
          className="mx-auto mb-8"
        />

        <div className="text-center mb-8">

          <h1 className="text-4xl font-bold text-[#0D2C6C]">
            Reset Password
          </h1>

          <p className="mt-2 text-slate-500">
            Choose a new secure password.
          </p>

        </div>

        <form
          onSubmit={updatePassword}
          className="space-y-6"
        >

          {/* Password */}

          <div>

            <label className="mb-2 block font-semibold text-slate-700">
              New Password
            </label>

            <div className="relative">

              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 focus:border-[#0D2C6C] focus:ring-4 focus:ring-blue-100 outline-none"
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

          {/* Strength */}

          <div>

            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">

              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{
                  width: strength.width,
                }}
              />

            </div>

            <p className="mt-2 text-sm text-slate-500">
              Password Strength:
              <span className="font-semibold ml-1">
                {strength.text}
              </span>
            </p>

          </div>

          {/* Requirements */}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

            <p className="font-semibold text-slate-700 mb-3">
              Password must contain:
            </p>

            <ul className="space-y-2 text-sm">

              <li className={strength.checks.length ? "text-green-600" : "text-slate-500"}>
                ✓ At least 8 characters
              </li>

              <li className={strength.checks.uppercase ? "text-green-600" : "text-slate-500"}>
                ✓ One uppercase letter
              </li>

              <li className={strength.checks.lowercase ? "text-green-600" : "text-slate-500"}>
                ✓ One lowercase letter
              </li>

              <li className={strength.checks.number ? "text-green-600" : "text-slate-500"}>
                ✓ One number
              </li>

              <li className={strength.checks.special ? "text-green-600" : "text-slate-500"}>
                ✓ One special character
              </li>

            </ul>

          </div>

          {/* Confirm */}

          <div>

            <label className="mb-2 block font-semibold text-slate-700">
              Confirm Password
            </label>

            <div className="relative">

              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirm}
                onChange={(e) =>
                  setConfirm(e.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 focus:border-[#0D2C6C] focus:ring-4 focus:ring-blue-100 outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirm(!showConfirm)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0D2C6C]"
              >
                {showConfirm ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

            {confirm.length > 0 && (

              <p
                className={`mt-2 text-sm ${
                  password === confirm
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {password === confirm
                  ? "✓ Passwords match"
                  : "Passwords do not match"}
              </p>

            )}

          </div>

          {/* Button */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#0D2C6C] py-3 font-semibold text-white transition hover:bg-[#17408B] disabled:opacity-60"
          >

            {loading ? (
              <>
                <ClipLoader
                  size={18}
                  color="white"
                />
                Updating...
              </>
            ) : (
              "Update Password"
            )}

          </button>

        </form>

      </div>

    </main>
  );
}