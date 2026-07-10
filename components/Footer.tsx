import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  Globe,
  Code2,
} from "lucide-react";

export default function Footer() {
  return (
  <footer className="border-t border-white/10 bg-[#071628]">
  <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-8 py-3 lg:flex-row">

    {/* Logo */}
    <Link href="/" className="flex items-center">
      <Image
        src="/navbar_logo.png"
        alt="Spin4Chinuch"
        width={700}
        height={170}
        className="w-[180px] h-auto"
      />
    </Link>

        {/* Contact Information */}
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-blue-400" />
            <span>(203) 768-6234</span>
          </div>

          <a
            href="mailto:info@chinuchyehudiusa.org"
            className="flex items-center gap-2 transition hover:text-blue-300"
          >
            <Mail size={18} className="text-blue-400" />
            info@chinuchyehudiusa.org
          </a>

          <a
            href="https://chinuchyehudiusa.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition hover:text-blue-300"
          >
            <Globe size={18} className="text-blue-400" />
            chinuchyehudiusa.org
          </a>

        </div>

        {/* Developer */}
    <div className="text-right text-xs">

          <div className="flex items-center justify-end gap-2 text-sm text-slate-300">
            <Code2 size={18} className="text-blue-400" />
            <span>
              Made by{" "}
              <span className="font-semibold text-white">
                Shoshana Bernstein
              </span>
            </span>
          </div>

          <a
            href="mailto:shoshanbernstein@gmail.com"
            className="mt-1 block text-sm text-blue-300 transition hover:text-blue-200"
          >
            shoshanbernstein@gmail.com
          </a>

        </div>

      </div>

      {/* Bottom Copyright */}
  <div className="border-t border-white/10 py-1.5 text-center text-xs text-slate-500">
    © {new Date().getFullYear()} Spin4Chinuch. All Rights Reserved.
  </div>
</footer>
  );
}