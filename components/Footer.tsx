import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-blue-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14">

        <div className="grid gap-10 md:grid-cols-3">

          {/* Logo */}
          <div>
            <Image
              src="/navbar_logo.png"
              alt="Spin4Chinuch"
              width={220}
              height={60}
              className="w-auto h-14"
            />

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
              Supporting Jewish education through exciting fundraising
              experiences and amazing prizes.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-[#142A52]">
              Navigation
            </h3>

            <div className="flex flex-col gap-3 text-slate-600">
              <Link href="/">Home</Link>
              <Link href="/prizes">Prizes</Link>
              <Link href="/winners">Winners</Link>
              <Link href="/buy-spins">Buy Spins</Link>
              <Link href="/spin">Spin the Wheel</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-[#142A52]">
              Contact
            </h3>

            <div className="space-y-3 text-slate-600">
              <p>info@spin4chinuch.org</p>
              <p>(555) 123-4567</p>

              <Link
                href="/contact"
                className="inline-block mt-4 rounded-full bg-[#142A52] px-6 py-3 font-semibold text-white transition hover:bg-[#4267A8]"
              >
                Contact Us
              </Link>
            </div>
          </div>

        </div>

        <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Spin4Chinuch. All Rights Reserved.
        </div>

      </div>
    </footer>
  );
}