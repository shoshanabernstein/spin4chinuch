"use client";

import Image from "next/image";
import Link from "next/link";

const navItems = [
  { href: "/#about", label: "About" },
  { href: "/prizes", label: "Prizes" },
  { href: "/winners", label: "Winners" },
  { href: "/buy-spins", label: "Donate" },
];

export default function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/40 bg-white/85 shadow-[0_12px_40px_rgba(18,48,74,.12)] backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-3 md:gap-4" aria-label="Spin4Chinuch home">
          <Image
            src="/logo.png"
            alt="Spin4Chinuch logo"
            width={112}
            height={56}
            className="h-12 w-auto md:h-14"
            priority
          />

          <div className="hidden sm:block">
            <p className="text-lg font-black tracking-tight text-[#12304a] md:text-xl">
              Spin4Chinuch
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0f8db3] md:text-sm">
              Chinuch Yehudi USA
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="font-bold text-[#12304a] transition hover:text-[#0f8db3]">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/login" className="hidden rounded-full border border-[#12304a]/20 px-5 py-3 font-black text-[#12304a] transition hover:bg-[#dff5f8] sm:inline-flex">
            Login
          </Link>
          <Link href="/spin" className="cy-button-primary px-5 py-3 text-sm md:px-7 md:text-base">
            Spin Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
