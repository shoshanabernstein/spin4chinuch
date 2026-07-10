"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { US_STATES, COUNTRIES } from "@/lib/locations";
import toast from "react-hot-toast";

function getStrength(password: string) {
  if (password.length < 6)
    return {
      text: "Weak",
      color: "bg-red-500",
      width: "25%",
    };

  if (password.length < 10)
    return {
      text: "Good",
      color: "bg-yellow-500",
      width: "60%",
    };

  return {
    text: "Strong",
    color: "bg-green-500",
    width: "100%",
  };
}

export default function SignupPage() {

  function formatPhone(value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);

    const area = cleaned.slice(0, 3);
    const prefix = cleaned.slice(3, 6);
    const line = cleaned.slice(6, 10);

    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return `(${area}`;
    if (cleaned.length <= 6) return `(${area}) ${prefix}`;

    return `(${area}) ${prefix}-${line}`;
  }

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const strength = getStrength(form.password);


  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const digits = form.phone.replace(/\D/g, "");

    if (digits.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone,
          address1: form.address1.trim(),
          address2: form.address2.trim(),
          city: form.city.trim(),
          state: form.state,
          zip: form.zip.trim(),
          country: form.country,
        },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      toast.error("Unable to create account.");
      return;


    }

    setLoading(false);

    if (!data.session) {
      toast.success("Account created. Check your email to confirm your address.");
      router.replace("/login");
    } else {
      toast.success("Account created successfully!");
      router.replace("/dashboard");
    }


  }
  return (
    <main className="min-h-screen bg-[#F6F9FD] py-20 px-6 flex justify-center">

      <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-10">

        <div className="text-center mb-10">

          <h1 className="text-4xl font-bold text-[#0D2C6C]">
            Create Your Account
          </h1>

          <p className="mt-2 text-slate-500">
            Support Chinuch Yehudi
          </p>

        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* ✅ FORM STARTS HERE */}
        <form onSubmit={signUp} className="space-y-5">

          <div className="grid md:grid-cols-2 gap-5">

            <input
              name="first_name"
              placeholder="First Name"
              required
              value={form.first_name}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 p-3"
            />

            <input
              name="last_name"
              placeholder="Last Name"
              required
              value={form.last_name}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 p-3"
            />

          </div>

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 p-3"
          />

          {/* Password */}
          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 p-3 pr-12"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

          </div>
          <div className="mt-2">

            <div className="h-2 rounded-full bg-slate-200">

              <div
                className={`h-2 rounded-full ${strength.color}`}
                style={{
                  width: strength.width,
                }}
              />

            </div>

            <p className="mt-1 text-sm text-slate-500">

              Password Strength:

              <span className="font-semibold">

                {" "}
                {strength.text}

              </span>

            </p>

          </div>

          {/* Confirm Password */}
          <div className="relative">

            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 p-3 pr-12"
            />

            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

          </div>

          <input
            name="phone"
            placeholder="Phone Number"
            required
            value={form.phone}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "").slice(0, 10);

              setForm((prev) => ({
                ...prev,
                phone: formatPhone(raw),
              }));
            }}
            className="w-full rounded-xl border border-slate-300 p-3"
          />

          <input
            name="address1"
            placeholder="Address Line 1"
            required
            value={form.address1}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 p-3"
          />

          <input
            name="address2"
            placeholder="Address Line 2 (Optional)"
            value={form.address2}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 p-3"
          />

          <div className="grid md:grid-cols-2 gap-5">

            <input
              name="city"
              placeholder="City"
              required
              value={form.city}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 p-3"
            />

            <select
              name="state"
              required
              value={form.state}
              onChange={(e) =>
                setForm({ ...form, state: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 p-3 bg-white focus:border-[#0D2C6C] focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select State</option>

              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <input
              name="zip"
              placeholder="ZIP Code"
              required
              value={form.zip}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 p-3"
            />

            <select
              name="country"
              required
              value={form.country}
              onChange={(e) =>
                setForm({ ...form, country: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 p-3 bg-white focus:border-[#0D2C6C] focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select Country</option>

              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#0D2C6C] py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-[#17408B] disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <p className="text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#0D2C6C] hover:underline"
            >
              Login
            </Link>
          </p>
        </div>

      </div>

    </main>
  );
}
