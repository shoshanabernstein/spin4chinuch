import { Globe, Mail } from "lucide-react";

export default function Contact() {
  return (
    <section id="contact" className="relative mx-auto site-width scroll-mt-28 px-5 pb-12 sm:px-8 sm:pb-16 lg:px-10">
      {/* Background Glow */}
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#80A8F7]/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-[#F4F7FC] p-6 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[#4267A8]">
            Contact Us
          </span>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-[#142A52] sm:text-4xl">
            We&apos;d Love to Hear From You
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Have questions about Spin for Chinuch, prizes, donations, or sponsorship
            opportunities? Reach out—we&apos;re happy to help.
          </p>

            <div className="mx-auto mt-6 grid max-w-2xl gap-4 md:grid-cols-2">
            <a href="mailto:spinforchinuchyehudi@gmail.com" className="group block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F6ED8]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4267A8] to-[#80A8F7] text-white">
                <Mail size={26} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#142A52]">
                Email
              </h3>

              <span className="mt-2 block break-all text-slate-600 transition group-hover:text-[#2F6ED8]">
                spinforchinuchyehudi@gmail.com
              </span>
            </a>

            <a href="https://chinuchyehudiusa.org/" target="_blank" rel="noopener noreferrer" className="group block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F6ED8]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4267A8] to-[#80A8F7] text-white">
                <Globe size={26} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#142A52]">
                Website
              </h3>

              <span className="mt-2 block text-slate-600 transition group-hover:text-[#2F6ED8]">
                chinuchyehudiusa.org
              </span>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
