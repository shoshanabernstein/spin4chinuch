"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, HeartHandshake, Loader2, TriangleAlert } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SOLD_OUT_MESSAGE } from "@/lib/spin-sales";
import { supabase } from "@/lib/supabase";

type VerificationState = "checking" | "succeeded" | "processing" | "failed";

function PaymentResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent");
  const [state, setState] = useState<VerificationState>("checking");
  const [spins, setSpins] = useState(0);
  const [failureMessage, setFailureMessage] = useState("");

  useEffect(() => {
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    async function verifyPayment() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        if (!paymentIntent || !session) {
          setFailureMessage("This page is missing a valid payment confirmation.");
          setState("failed");
          return;
        }

        const response = await fetch(
          `/api/payment-status?payment_intent=${encodeURIComponent(paymentIntent)}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            signal: controller.signal,
          }
        );
        const data = await response.json();
        if (!active) return;

        if (!response.ok) {
          setFailureMessage(data.error || "The payment could not be verified. Check your dashboard before purchasing again.");
          setState("failed");
          return;
        }

        if (data.status === "refunded" || data.status === "refund_pending") {
          setFailureMessage(data.reason === "discount_balance_changed" ? "Your discount was used on another purchase. This payment is being fully refunded; no spins were added." : data.status === "refunded"
            ? `${SOLD_OUT_MESSAGE} Your payment was refunded; no spins were added. Your bank may take several days to show the refund.`
            : `${SOLD_OUT_MESSAGE} A full refund is pending; no spins were added. Please contact support if you need help.`);
          setState("failed");
          return;
        }

        if (data.status === "succeeded") {
          // The server only returns success after the purchased spins are credited.
          setSpins(data.spins ?? 0);
          setState("succeeded");
          router.replace("/spin");
          return;
        }

        if (data.status === "processing") {
          setState("processing");
          attempts += 1;
          // Recheck pending payments for up to a minute without overlapping requests.
          if (attempts < 20) timer = setTimeout(() => void verifyPayment(), 3000);
          return;
        }

        setFailureMessage("Your payment has not completed. Check your dashboard before trying again, or contact us for help.");
        setState("failed");
      } catch {
        if (!active) return;
        setFailureMessage("We could not confirm your purchase. Check your dashboard or contact support before purchasing again.");
        setState("failed");
      }
    }

    void verifyPayment();
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [paymentIntent, router]);

  const confirmed = state === "succeeded";
  const failed = state === "failed";

  return (
    <main className="relative flex min-h-[calc(100svh-6rem)] items-center justify-center overflow-hidden bg-[#FAF8F3] px-4 py-16 text-[#102A52] sm:px-6 sm:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -right-48 -top-52 h-[38rem] w-[38rem] rounded-full border border-[#649CD3]/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -left-44 h-[36rem] w-[36rem] rounded-full border-[48px] border-[#649CD3]/[0.07]" />

      <section aria-live="polite" aria-atomic="true" className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#DBE2E9] bg-white shadow-[0_20px_70px_#102a5208]">
        <div className="px-6 py-12 text-center sm:px-14 sm:py-16">
          <div aria-hidden="true" className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 112 112" className="absolute inset-0 h-full w-full fill-none">
              <circle cx="56" cy="56" r="50" stroke="#DCE7F1" strokeWidth="2" />
              <circle cx="56" cy="56" r="50" stroke="#649CD3" strokeWidth="4" strokeDasharray="95 220" strokeLinecap="round" transform="rotate(-55 56 56)" />
              <circle cx="56" cy="56" r="38" stroke="#E7C96D" strokeWidth="3" strokeDasharray="65 175" strokeLinecap="round" transform="rotate(95 56 56)" />
            </svg>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EDF3F8] text-[#467EB3]">
              {confirmed ? <Check className="h-8 w-8" /> : failed ? <TriangleAlert className="h-7 w-7" /> : <Loader2 className="h-7 w-7 motion-safe:animate-spin" />}
            </div>
          </div>

          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#527CA4]">
            {confirmed ? "Payment confirmed" : failed ? "A little help needed" : state === "processing" ? "Payment processing" : "One moment"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl">
            {confirmed ? "You're ready to spin." : failed ? "Let's check your payment." : state === "processing" ? "Almost ready to spin." : "Getting your spins ready."}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[#52657B] sm:text-lg">
            {confirmed
              ? `Your ${spins === 1 ? "spin is" : `${spins} spins are`} ready. Taking you straight to the wheel...`
              : failed
                ? failureMessage
                : state === "processing"
                  ? "Your payment is still processing. Some payments take a little longer. Please check your dashboard before purchasing again."
                  : "We're confirming your purchase. You'll go straight to the wheel once your spins are ready."}
          </p>

          {confirmed && (
            <Link href="/spin" replace className="mt-8 inline-flex items-center justify-center gap-3 rounded-lg bg-[#E7C96D] px-7 py-4 font-semibold transition hover:bg-[#F0D580]">
              Spin the Wheel <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          {(failed || state === "processing") && (
            <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#102A52] px-7 py-4 font-semibold text-white transition hover:bg-[#1C3D68]">
                Check dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/#contact" className="font-semibold text-[#467EB3] underline-offset-4 hover:underline">Contact us</Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-[#DBE2E9] bg-[#F5F8FB] px-6 py-5 text-center text-sm text-[#52657B]">
          <HeartHandshake aria-hidden="true" className="h-5 w-5 shrink-0 text-[#527CA4]" />
          <p>Thank you for supporting Chinuch Yehudi.</p>
        </div>
      </section>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-[#FAF8F3]" />}>
        <PaymentResult />
      </Suspense>
    </ProtectedRoute>
  );
}
