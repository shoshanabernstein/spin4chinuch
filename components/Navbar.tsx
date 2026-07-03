"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast/headless";


export default function Navbar() {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const { user } = useAuth();

  const isLoggedIn = !!user;



  const handleLogout = async () => {
    await supabase.auth.signOut();

    toast.success("Logged out successfully");
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-blue-200/10 bg-[#071628]/90 backdrop-blur-xl shadow-xl">
      <div className="mx-auto flex h-28 max-w-7xl items-center justify-between px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/navbar_logo.png"
            alt="Spin4Chinuch"
            width={500}
            height={120}
            priority
            className="h-20 w-auto"
          />
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-10 text-lg">

          <Link
            href="/spin"
            className="font-medium text-white transition hover:text-blue-300"
          >
            Spin
          </Link>

          <Link
            href="/prizes"
            className="font-medium text-white transition hover:text-blue-300"
          >
            Prizes
          </Link>

          <Link
            href="/winners"
            className="font-medium text-white transition hover:text-blue-300"
          >
            Winners
          </Link>

          {/* Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2F6ED8] to-[#5E9CF4] px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              Account
              <ChevronDown
                size={18}
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-blue-200/10 bg-[#0C1F38] shadow-2xl">

                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="block px-5 py-3 text-white transition hover:bg-blue-500/10"
                    >
                      Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="block w-full px-5 py-3 text-left text-red-300 transition hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block px-5 py-3 text-white transition hover:bg-blue-500/10"
                  >
                    Login
                  </Link>
                )}

              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}