import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { Gift, GraduationCap, Heart, Sparkles, Ticket, Trophy } from "lucide-react";

const stats = [
  { value: "100%", label: "of proceeds support the mission" },
  { value: "3", label: "simple steps from donation to spin" },
  { value: "24/7", label: "online campaign access" },
];

const features = [
  {
    icon: Gift,
    title: "Exciting prizes",
    copy: "A live prize wheel keeps donors engaged with gift cards, rewards, and premium campaign prizes.",
  },
  {
    icon: GraduationCap,
    title: "Meaningful impact",
    copy: "Every spin helps strengthen Chinuch Yehudi USA and supports access to quality Jewish education.",
  },
  {
    icon: Heart,
    title: "Built for community",
    copy: "Supporters can buy spins, celebrate wins, and share the excitement with family and friends.",
  },
];

const steps = [
  { title: "Buy spins", copy: "Choose a spin package that matches your giving level." },
  { title: "Spin the wheel", copy: "Use your spins instantly on the animated prize wheel." },
  { title: "Celebrate impact", copy: "Win prizes while helping students, teachers, and families thrive." },
];

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen overflow-hidden bg-[#faf7f0] pt-24">
        <section className="relative px-6 py-20 md:py-28">
          <div className="absolute -right-32 top-0 h-[34rem] w-[34rem] rounded-full bg-yellow-200/40 blur-3xl" />
          <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A44D]/30 bg-white/70 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-[#142A52] shadow-sm">
                <Sparkles className="h-4 w-4 text-[#C9A44D]" />
                Fundraising made joyful
              </div>

              <Image src="/logo.png" alt="Spin4Chinuch logo" width={220} height={120} priority className="mt-8 h-auto w-48" />

              <h1 className="mt-8 text-5xl font-black leading-[0.95] text-[#142A52] md:text-7xl">
                Spin. Support. <span className="text-[#C9A44D]">Strengthen.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-xl leading-8 text-gray-600">
                Spin4Chinuch turns giving into an unforgettable campaign experience—support Jewish education, earn spins, and win exciting prizes along the way.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/buy-spins" className="btn-main inline-flex items-center justify-center gap-3">
                  <Ticket className="h-5 w-5" />
                  Buy Spins
                </Link>
                <Link href="/prizes" className="inline-flex items-center justify-center rounded-full border-2 border-[#142A52] px-8 py-4 font-black text-[#142A52] transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
                  View Prizes
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/75 p-5 shadow-lg ring-1 ring-[#C9A44D]/15">
                    <p className="text-3xl font-black text-[#142A52]">{stat.value}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute h-[26rem] w-[26rem] animate-pulse rounded-full bg-yellow-400/30 blur-3xl" />
              <div className="relative grid h-[25rem] w-[25rem] place-items-center rounded-full border-[18px] border-[#C9A44D] bg-[conic-gradient(from_0deg,#142A52,#C9A44D,#4267a8,#f4d77c,#142A52)] shadow-2xl md:h-[32rem] md:w-[32rem]">
                <div className="grid h-44 w-44 place-items-center rounded-full bg-white text-center text-4xl font-black text-[#142A52] shadow-2xl ring-8 ring-white/30">
                  SPIN
                </div>
                <div className="absolute -top-3 h-16 w-12 rounded-b-full bg-[#C9A44D] shadow-lg" />
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="font-bold uppercase tracking-[0.2em] text-[#C9A44D]">Why it works</p>
              <h2 className="mt-4 text-4xl font-black text-[#142A52] md:text-5xl">A polished donor journey from first click to final celebration.</h2>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="glass rounded-3xl p-8 transition hover:-translate-y-2 hover:shadow-2xl">
                  <Icon className="h-12 w-12 text-[#C9A44D]" />
                  <h3 className="mt-6 text-2xl font-black text-[#142A52]">{title}</h3>
                  <p className="mt-4 leading-7 text-gray-600">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#142A52] px-6 py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="font-bold uppercase tracking-[0.2em] text-yellow-300">How it works</p>
              <h2 className="mt-4 text-4xl font-black md:text-5xl">Three simple steps.</h2>
              <p className="mt-5 text-lg leading-8 text-blue-100">Designed for mobile and desktop supporters, the experience keeps the mission clear while making participation fun.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step.title} className="rounded-3xl border border-white/10 bg-white/10 p-7 backdrop-blur">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-[#C9A44D] font-black text-[#142A52]">{index + 1}</div>
                  <h3 className="mt-5 text-2xl font-black">{step.title}</h3>
                  <p className="mt-3 text-blue-100">{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] bg-white p-10 text-center shadow-2xl ring-1 ring-[#C9A44D]/20 md:p-14">
            <Trophy className="h-14 w-14 text-[#C9A44D]" />
            <h2 className="mt-6 text-4xl font-black text-[#142A52] md:text-5xl">Ready to spin for Chinuch?</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">Join the campaign today and help build momentum for Jewish education—one spin, one prize, and one act of generosity at a time.</p>
            <Link href="/spin" className="btn-main mt-8">Start Spinning</Link>
          </div>
        </section>
      </main>
    </>
  );
}
