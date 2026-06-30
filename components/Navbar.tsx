"use client";

import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-yellow-500/20 bg-[#081428]/80 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto h-24 px-8 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Spin4Chinuch logo"
            width={112}
            height={56}
            className="h-14 w-auto"
          />

          <div>
            <h1 className="text-white text-xl font-black tracking-wide">
              Spin to Win
            </h1>

            <p className="text-yellow-400 text-sm">
              Supporting Jewish Education
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-8">

          <Link
            href="/spin"
            className="text-white font-semibold hover:text-yellow-400 transition"
          >
            Spin
          </Link>

          <Link
            href="/prizes"
            className="text-white font-semibold hover:text-yellow-400 transition"
          >
            Prizes
          </Link>

          <Link
            href="/winners"
            className="text-white font-semibold hover:text-yellow-400 transition"
          >
            Winners
          </Link>

          <Link
            href="/login"
            className="rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 px-7 py-3 font-bold text-[#142A52] shadow-lg hover:scale-105 hover:shadow-yellow-400/40 transition-all"
          >
            Login
          </Link>

        </div>
      </div>
    </nav>
  );
}