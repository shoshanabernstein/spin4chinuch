import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { BookOpen, Gift, GraduationCap, HeartHandshake, Lightbulb, Sparkles, Ticket, UsersRound } from "lucide-react";

const stats = [
  { value: "Every", label: "spin helps a child stay connected to Jewish learning" },
  { value: "3", label: "ways to participate: donate, spin, share" },
  { value: "25+", label: "recent winners highlighted for campaign momentum" },
];

const programs = [
  {
    icon: UsersRound,
    title: "Family guidance",
    copy: "Inspired by Chinuch Yehudi's focus on helping Israeli families explore Jewish school options with care and dignity.",
  },
  {
    icon: BookOpen,
    title: "Jewish learning",
    copy: "The campaign celebrates the belief that Jewish continuity is strengthened through meaningful Jewish education.",
  },
  {
    icon: HeartHandshake,
    title: "Community support",
    copy: "Supporters become partners in affordability, encouragement, and opportunity for families seeking Chinuch.",
  },
];

const steps = [
  { title: "Choose your gift", copy: "Buy a spin package and dedicate your support to Chinuch Yehudi USA's mission." },
  { title: "Spin with joy", copy: "The interactive wheel makes every donation exciting and shareable." },
  { title: "Light a spark", copy: "Your participation helps more children experience a vibrant Jewish school environment." },
];

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="cy-page overflow-hidden">
        <section className="relative px-6 py-20 md:py-28">
          <div className="absolute -right-32 top-0 h-[34rem] w-[34rem] rounded-full bg-[#dff5f8] blur-3xl" />
          <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-[#d6a84f]/20 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0f8db3]/20 bg-white/75 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-[#12304a] shadow-sm">
                <Sparkles className="h-4 w-4 text-[#d6a84f]" />
                Each child is a spark of light
              </div>

              <Image src="/logo.png" alt="Spin4Chinuch logo" width={220} height={120} priority className="mt-8 h-auto w-48" />

              <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-[-0.05em] text-[#12304a] md:text-7xl">
                Spin for the next generation of <span className="text-[#0f8db3]">Jewish education.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-xl leading-8 text-slate-600">
                A joyful prize-wheel campaign for Chinuch Yehudi USA—helping families access Jewish education while turning every donation into a moment of excitement.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/buy-spins" className="cy-button-primary">
                  <Ticket className="h-5 w-5" />
                  Donate & Spin
                </Link>
                <Link href="#about" className="cy-button-secondary">
                  Learn About Chinuch Yehudi
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="cy-card rounded-2xl p-5">
                    <p className="text-3xl font-black text-[#0f8db3]">{stat.value}</p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute h-[26rem] w-[26rem] animate-pulse rounded-full bg-[#0f8db3]/20 blur-3xl" />
              <div className="relative grid h-[25rem] w-[25rem] place-items-center rounded-full border-[18px] border-white bg-[conic-gradient(from_0deg,#12304a,#0f8db3,#d6a84f,#dff5f8,#12304a)] shadow-2xl ring-8 ring-[#dff5f8] md:h-[32rem] md:w-[32rem]">
                <div className="grid h-44 w-44 place-items-center rounded-full bg-white text-center text-4xl font-black text-[#12304a] shadow-2xl ring-8 ring-white/40">
                  SPIN
                </div>
                <div className="absolute -top-4 h-16 w-12 rounded-b-full bg-[#d6a84f] shadow-lg" />
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="px-6 py-20">
          <div className="cy-container grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div className="cy-card rounded-[2rem] p-8 md:p-10">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#dff5f8] text-[#0f8db3]">
                <Lightbulb className="h-9 w-9" />
              </div>
              <p className="cy-kicker mt-8">About Chinuch Yehudi USA</p>
              <h2 className="cy-heading mt-4 text-4xl md:text-5xl">Helping families choose a Jewish future.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Chinuch Yehudi USA helps Israeli families in the United States move children from public school into Jewish day school by making the path more approachable, affordable, and supported.
              </p>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Their public message is simple and powerful: each child is a spark of light, and Jewish continuity is made possible through Jewish education.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[2rem] bg-[#12304a] p-8 text-white shadow-2xl sm:col-span-2">
                <GraduationCap className="h-12 w-12 text-[#d6a84f]" />
                <h3 className="mt-5 text-3xl font-black">This campaign supports that mission with joy.</h3>
                <p className="mt-4 leading-7 text-[#dff5f8]">
                  Spin4Chinuch transforms a donation into a memorable moment, making it easy for supporters to give, participate, and invite others into the cause.
                </p>
              </div>
              {programs.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="cy-card rounded-[1.5rem] p-7">
                  <Icon className="h-10 w-10 text-[#0f8db3]" />
                  <h3 className="mt-5 text-2xl font-black text-[#12304a]">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#12304a] px-6 py-20 text-white">
          <div className="cy-container grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="font-black uppercase tracking-[0.2em] text-[#8fe5ef]">How it works</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-5xl">Three steps. One shared mission.</h2>
              <p className="mt-5 text-lg leading-8 text-[#dff5f8]">The experience keeps the Chinuch Yehudi message front and center while making donor participation easy, exciting, and mobile-friendly.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step.title} className="cy-card-dark rounded-3xl p-7">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-[#d6a84f] font-black text-[#12304a]">{index + 1}</div>
                  <h3 className="mt-5 text-2xl font-black">{step.title}</h3>
                  <p className="mt-3 text-[#dff5f8]">{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="cy-container flex max-w-5xl flex-col items-center rounded-[2rem] bg-white p-10 text-center shadow-2xl ring-1 ring-[#0f8db3]/15 md:p-14">
            <Gift className="h-14 w-14 text-[#d6a84f]" />
            <h2 className="cy-heading mt-6 text-4xl md:text-5xl">Ready to light another spark?</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Donate, spin, and help more children experience the warmth, identity, and continuity of Jewish education.</p>
            <Link href="/spin" className="cy-button-primary mt-8">Start Spinning</Link>
          </div>
        </section>
      </main>
    </>
  );
}
