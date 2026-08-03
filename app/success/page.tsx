"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Sparkles,
  Ticket,
  TriangleAlert,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";

type VerificationState = "checking" | "succeeded" | "processing" | "failed";

function PaymentResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>("checking");
  const [spins, setSpins] = useState(0);
  const [failureMessage, setFailureMessage] = useState("");

  useEffect(() => {
    async function verifyPayment() {
      const paymentIntent = searchParams.get("payment_intent");
      const { data: { session } } = await supabase.auth.getSession();

      if (!paymentIntent || !session) {
        setFailureMessage("This page is missing a valid payment confirmation.");
        setState("failed");
        return;
      }

      const response = await fetch(
        `/api/payment-status?payment_intent=${encodeURIComponent(paymentIntent)}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        setFailureMessage(data.error || "The payment could not be verified.");
        setState("failed");
        return;
      }

      setSpins(data.spins ?? 0);
      setState(data.status === "succeeded" ? "succeeded" : "processing");
    }

    void verifyPayment();
  }, [searchParams]);

  useEffect(() => {
    if (state !== "succeeded") return;
    const timer = setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 8000);
    return () => clearTimeout(timer);
  }, [router, state]);

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#071628] px-4 py-12 sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[#2F6ED8]/25 blur-[120px]" />
        <div className="absolute bottom-[-12rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[#C9A44D]/18 blur-[110px]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="relative mx-auto flex min-h-[620px] max-w-5xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-[36px] border border-white/10 bg-[#0C1F38]/90 shadow-[0_35px_120px_rgba(0,0,0,.45)] backdrop-blur-xl">
          <div className="h-1.5 bg-gradient-to-r from-[#2F6ED8] via-[#F5DE98] to-[#2F6ED8]" />

          {state === "checking" && (
            <div className="px-6 py-20 text-center sm:px-12">
              <div className="relative mx-auto h-24 w-24">
                <div className="absolute inset-0 animate-ping rounded-full bg-[#2F6ED8]/20" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#5E9CF4]/25 bg-[#2F6ED8]/15">
                  <Loader2 className="h-10 w-10 animate-spin text-[#8DB9F4]" />
                </div>
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em] text-[#8DB9F4]">Secure verification</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">Confirming your payment</h1>
              <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-[#9DB2CE]">Stripe is securely confirming the purchase. Please keep this page open.</p>
            </div>
          )}

          {state === "succeeded" && (
            <div className="grid lg:grid-cols-[1.1fr_.9fr]">
              <div className="relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16 lg:text-left">
                <Sparkles className="absolute right-10 top-10 h-8 w-8 text-[#C9A44D]/60" />
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-400/15 text-emerald-300 shadow-[0_0_45px_rgba(52,211,153,.15)] lg:mx-0">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em] text-[#E8CD7A]">Payment confirmed</p>
                <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] text-white sm:text-6xl">You’re ready to spin.</h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-[#BFD2EB]">
                  Your purchase supports Chinuch Yehudi and brings you one step closer to an exciting prize reveal.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2F6ED8] to-[#5E9CF4] px-7 py-4 font-black text-white shadow-lg shadow-[#2F6ED8]/25 transition hover:-translate-y-0.5">
                    Go to dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/prizes" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 py-4 font-bold text-white transition hover:bg-white/[0.1]">View prizes</Link>
                </div>
              </div>

              <div className="border-t border-white/10 bg-[#071628]/55 p-6 sm:p-10 lg:border-l lg:border-t-0">
                <div className="rounded-[28px] border border-[#C9A44D]/25 bg-gradient-to-br from-[#C9A44D]/15 to-[#2F6ED8]/10 p-7 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9A44D]/15 text-[#F5DE98]"><Ticket className="h-7 w-7" /></div>
                  <p className="mt-5 text-6xl font-black text-white">{spins}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-[#E8CD7A]">{spins === 1 ? "Spin purchased" : "Spins purchased"}</p>
                </div>
                <div className="mt-6 space-y-3 text-sm text-[#BFD2EB]">
                  <div className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-300" /><span>Payment securely verified</span></div>
                  <div className="flex items-center gap-3"><HeartHandshake className="h-5 w-5 text-[#E8CD7A]" /><span>Supporting Jewish education</span></div>
                  <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#8DB9F4]" /><span>Spins credited through Stripe confirmation</span></div>
                </div>
                <p className="mt-6 text-center text-xs leading-5 text-[#7F97B6]">Redirecting to your dashboard in a few seconds…</p>
              </div>
            </div>
          )}

          {state === "processing" && (
            <div className="px-6 py-20 text-center sm:px-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#C9A44D]/15 text-[#F5DE98]"><Loader2 className="h-9 w-9 animate-spin" /></div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em] text-[#E8CD7A]">Still processing</p>
              <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">Your payment is on its way.</h1>
              <p className="mx-auto mt-4 max-w-lg text-lg leading-8 text-[#9DB2CE]">Stripe has not completed confirmation yet. Your dashboard will update as soon as processing finishes.</p>
              <Link href="/dashboard" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#2F6ED8] px-7 py-4 font-black text-white">Check dashboard <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}

          {state === "failed" && (
            <div className="px-6 py-20 text-center sm:px-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-400/15 text-amber-300"><TriangleAlert className="h-9 w-9" /></div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em] text-amber-300">Verification needed</p>
              <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">Payment could not be confirmed.</h1>
              <p className="mx-auto mt-4 max-w-lg text-lg leading-8 text-[#9DB2CE]">{failureMessage || "No verified successful payment was found for this page."}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/buy-spins" className="rounded-full bg-[#2F6ED8] px-7 py-4 font-black text-white">Return to checkout</Link>
                <Link href="/dashboard" className="rounded-full border border-white/15 bg-white/[0.05] px-7 py-4 font-bold text-white">Dashboard</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-[#071628]" />}>
        <PaymentResult />
      </Suspense>
    </ProtectedRoute>
  );
}
