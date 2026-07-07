import { HeartHandshake } from "lucide-react";

export default function About() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        {/* Left Side */}
        <div>
          <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[#4267A8]">
            About Spin4Chinuch
          </span>

          <h2 className="mt-6 text-4xl font-black text-[#142A52] md:text-5xl">
            Making Fundraising
            <br />
            Exciting Again.
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Spin4Chinuch combines charitable giving with the excitement of
            winning amazing prizes. Every spin purchased directly supports
            Chinuch Yehudi while giving participants a fun and engaging way to
            make a difference.
          </p>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            Whether you're spinning for yourself or supporting our mission,
            every contribution helps strengthen Jewish education and our
            community.
          </p>
        </div>

        {/* Right Side */}
        <div className="relative">
          <div className="absolute -left-8 -top-8 h-64 w-64 rounded-full bg-[#80A8F7]/20 blur-3xl" />

          <div className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-white p-10 shadow-xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#4267A8] to-[#80A8F7] text-white shadow-lg">
              <HeartHandshake size={40} />
            </div>

            <h3 className="mt-8 text-3xl font-bold text-[#142A52]">
              Our Mission
            </h3>

            <p className="mt-4 leading-8 text-slate-600">
              Every dollar raised goes toward supporting Chinuch Yehudi and
              creating opportunities for students and families. By participating,
              you're helping build a stronger future while enjoying the thrill
              of every spin.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-200 pt-8 text-center">
              <div>
                <h4 className="text-3xl font-black text-[#142A52]">100%</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Supports the Cause
                </p>
              </div>

              <div>
                <h4 className="text-3xl font-black text-[#142A52]">🎁</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Great Prizes
                </p>
              </div>

              <div>
                <h4 className="text-3xl font-black text-[#142A52]">❤️</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Community Impact
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}