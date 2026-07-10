"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-blue-100">

        <div className="text-7xl mb-6">🎉</div>

        <h1 className="text-4xl font-extrabold text-blue-700 mb-4">
          Payment Successful!
        </h1>

        <p className="text-gray-600 text-lg mb-8">
          Your payment was received securely.
        </p>

        <div className="bg-blue-50 rounded-2xl p-6 mb-8">
          <p className="text-blue-700 font-semibold text-xl">
            Your spins may take a moment to appear while Stripe confirms the payment.
          </p>
        </div>

        <div className="animate-pulse text-gray-500">
          Redirecting to your dashboard...
        </div>
      </div>
    </main>
  );
}
