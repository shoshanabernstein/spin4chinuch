"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

const links = [
  { href: "/spin", label: "Spin" },
  { href: "/prizes", label: "Prizes" },
  { href: "/winners", label: "Winners" },
];

export default function Navbar() {
  const { user } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    setAccountOpen(false);
    setMobileOpen(false);
    toast.success("Logged out successfully");
    window.location.assign("/");
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-blue-200/10 bg-[#071628]/95 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:h-24 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Spin4Chinuch home" className="shrink-0">
          <Image src="/navbar_logo.png" alt="Spin4Chinuch" width={700} height={170} priority className="h-auto w-[210px] sm:w-[270px] lg:w-[310px]" />
        </Link>

        <div className="hidden items-center gap-7 text-base lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="font-semibold text-white transition hover:text-blue-300">{link.label}</Link>
          ))}
          <div ref={accountRef} className="relative">
            <button type="button" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2F6ED8] to-[#5E9CF4] px-5 py-2.5 font-bold text-white shadow-lg transition hover:brightness-110">
              Account <ChevronDown className={`h-4 w-4 transition ${accountOpen ? "rotate-180" : ""}`} />
            </button>
            {accountOpen && (
              <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-blue-200/10 bg-[#0C1F38] p-2 shadow-2xl">
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setAccountOpen(false)} className="block rounded-xl px-4 py-3 font-semibold text-white hover:bg-blue-500/10">Dashboard</Link>
                    <button onClick={handleLogout} className="block w-full rounded-xl px-4 py-3 text-left font-semibold text-red-300 hover:bg-red-500/10">Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block rounded-xl px-4 py-3 font-semibold text-white hover:bg-blue-500/10">Login</Link>
                    <Link href="/signup" className="block rounded-xl px-4 py-3 font-semibold text-white hover:bg-blue-500/10">Create account</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={mobileOpen} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white lg:hidden">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#071628] px-4 pb-5 pt-3 lg:hidden">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 font-semibold text-white hover:bg-white/5">{link.label}</Link>)}
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 font-semibold text-white hover:bg-white/5">Dashboard</Link>
              <button onClick={handleLogout} className="block w-full rounded-xl px-4 py-3 text-left font-semibold text-red-300 hover:bg-white/5">Logout</button>
            </>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-white/10 px-4 py-3 text-center font-bold text-white">Login</Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="rounded-xl bg-[#2F6ED8] px-4 py-3 text-center font-bold text-white">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
