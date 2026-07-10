import { Mail, Phone, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Contact() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      {/* Background Glow */}
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#80A8F7]/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-white p-10 shadow-xl md:p-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[#4267A8]">
            Contact Us
          </span>

          <h2 className="mt-6 text-4xl font-black text-[#142A52] md:text-5xl">
            We&apos;d Love to Hear From You
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Have questions about Spin4Chinuch, prizes, donations, or sponsorship
            opportunities? Reach out—we&apos;re happy to help.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4267A8] to-[#80A8F7] text-white">
                <Mail size={26} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#142A52]">
                Email
              </h3>

              <p className="mt-2 text-slate-600">
                info@spin4chinuch.org
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4267A8] to-[#80A8F7] text-white">
                <Phone size={26} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#142A52]">
                Phone
              </h3>

              <p className="mt-2 text-slate-600">
                (555) 123-4567
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4267A8] to-[#80A8F7] text-white">
                <MapPin size={26} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#142A52]">
                Location
              </h3>

              <p className="mt-2 text-slate-600">
                Brooklyn, NY
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Button href="/contact" variant="gold">
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
