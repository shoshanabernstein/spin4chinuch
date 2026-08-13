"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const minimalRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimal = minimalRoutes.some((route) => pathname.startsWith(route));
  const admin = pathname.startsWith("/admin");

  return (
    <>
      {!minimal && <Navbar />}
      <div className={`flex-1 ${minimal ? "" : "pt-20 sm:pt-24"}`}>{children}</div>
      {!minimal && !admin && <Footer />}
    </>
  );
}
