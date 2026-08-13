"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/admin");
      return;
    }

    void supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        const isAdmin = !error && data?.role === "admin";
        setAuthorized(isAdmin);
        if (!isAdmin) router.replace("/dashboard");
      });
  }, [authLoading, router, user]);

  if (authLoading || authorized === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#071628]">
        <div className="h-11 w-11 animate-spin rounded-full border-2 border-[#5E9CF4]/30 border-t-[#5E9CF4]" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#071628] text-center">
        <ShieldAlert className="h-10 w-10 text-[#C9A44D]" />
        <p className="mt-4 font-bold text-white">Administrator access required</p>
      </div>
    );
  }

  return <>{children}</>;
}
