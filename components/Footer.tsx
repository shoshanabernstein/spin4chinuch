import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Globe,
  HeartHandshake,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";

const exploreLinks = [
  { href: "/prizes", label: "Prizes" },
  { href: "/winners", label: "Winners" },
  { href: "/spin", label: "Spin the Wheel" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#071628] text-white">
      <div className="pointer-events-none absolute left-[-10rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#2F6ED8]/12 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[#C9A44D]/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.35fr_.65fr_.8fr] lg:gap-14 lg:pb-14">
          <div>
            <Link href="/" aria-label="Spin4Chinuch home" className="inline-flex">
              <Image src="/navbar_logo.png" alt="Spin4Chinuch" width={700} height={170} className="h-auto w-[230px] sm:w-[270px]" />
            </Link>
            <p className="mt-5 max-w-md text-base leading-7 text-[#BFD2EB]">
              Turning every spin into meaningful support for Jewish education and the families served by Chinuch Yehudi.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/buy-spins" className="inline-flex items-center rounded-full bg-gradient-to-r from-[#C9A44D] to-[#F0D47F] px-6 py-3 font-black text-[#142A52] transition hover:-translate-y-0.5">Buy Spins</Link>
              <a href="https://chinuchyehudiusa.org/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-6 py-3 font-bold text-white transition hover:bg-white/[0.1]">
                Visit Chinuch Yehudi <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8DB9F4]">Explore</p>
            <nav className="mt-5 grid gap-3" aria-label="Footer navigation">
              {exploreLinks.map((link) => (
                <Link key={link.href} href={link.href} className="w-fit font-semibold text-[#BFD2EB] transition hover:translate-x-1 hover:text-white">{link.label}</Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8DB9F4]">Connect</p>
            <div className="mt-5 space-y-4 text-sm text-[#BFD2EB]">
              <a href="mailto:spinforchinuchyehudi@gmail.com" className="flex items-start gap-3 transition hover:text-white">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2F6ED8]/15 text-[#8DB9F4]"><Mail className="h-4 w-4" /></span>
                <span className="break-all pt-2">spinforchinuchyehudi@gmail.com</span>
              </a>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2F6ED8]/15 text-[#8DB9F4]"><MapPin className="h-4 w-4" /></span>
                <span>Waterbury, Connecticut</span>
              </div>
              <a href="https://chinuchyehudiusa.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 transition hover:text-white">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2F6ED8]/15 text-[#8DB9F4]"><Globe className="h-4 w-4" /></span>
                <span>chinuchyehudiusa.org</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-7 text-xs text-[#7F97B6] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© {new Date().getFullYear()} Spin4Chinuch. All rights reserved.</span>
            <span className="inline-flex items-center gap-1.5"><HeartHandshake className="h-3.5 w-3.5 text-[#C9A44D]" /> Supporting Chinuch Yehudi</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#8DB9F4]" /> Secure payments by Stripe</span>
          </div>
          <p className="shrink-0">Website by Shoshana Bernstein</p>
        </div>
      </div>
    </footer>
  );
}
