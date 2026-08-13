"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const navItems = [
  { href: "/spin", label: "Spin" },
  { href: "/prizes", label: "Prizes" },
  { href: "/winners", label: "Winners" },
];

export default function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/40 bg-white/90 shadow-[0_12px_40px_rgba(18,48,74,.12)] backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Spin4Chinuch home">
          <span className="relative block h-16 w-20 overflow-hidden md:h-20 md:w-24">
            <Image
              src="/logo.png"
              alt="Spin4Chinuch logo"
              fill
              sizes="96px"
              className="scale-[2.85] object-contain object-[center_18%]"
              priority
            />
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-black text-[#12304a] transition hover:bg-[#dff5f8] hover:text-[#0f8db3] sm:px-5 md:text-base"
            >
              {item.label}
            </Link>
          ))}

          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-[#12304a]/20 bg-white px-3 py-2 text-sm font-black text-[#12304a] shadow-sm transition hover:bg-[#dff5f8] hover:text-[#0f8db3] focus:outline-none focus:ring-4 focus:ring-[#0f8db3]/20 sm:px-5 md:text-base"
              aria-haspopup="true"
            >
              Account
              <ChevronDown className="h-4 w-4 transition group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden="true" />
            </button>

            <div className="invisible absolute right-0 mt-3 w-44 translate-y-2 rounded-2xl border border-[#0f8db3]/15 bg-white p-2 opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <Link href="/dashboard" className="block rounded-xl px-4 py-3 text-sm font-black text-[#12304a] transition hover:bg-[#dff5f8] hover:text-[#0f8db3]">
                Dashboard
              </Link>
              <Link href="/login" className="block rounded-xl px-4 py-3 text-sm font-black text-[#12304a] transition hover:bg-[#dff5f8] hover:text-[#0f8db3]">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
