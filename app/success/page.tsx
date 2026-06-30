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
    <main className="min-h-screen cy-page flex items-center justify-center p-8">
      <div className="cy-card max-w-lg w-full rounded-3xl p-10 text-center">

        <div className="text-7xl mb-6">🎉</div>

        <h1 className="text-4xl font-extrabold text-[#12304a] mb-4">
          Payment Successful!
        </h1>

        <p className="text-slate-600 text-lg mb-8">
          Your spins have been added to your account.
        </p>

        <div className="bg-[#dff5f8] rounded-2xl p-6 mb-8">
          <p className="text-[#12304a] font-semibold text-xl">
            Thank you for supporting Jewish education ❤️
          </p>
        </div>

        <div className="animate-pulse text-gray-500">
          Redirecting to your dashboard...
        </div>
      </div>
    </main>
  );
}