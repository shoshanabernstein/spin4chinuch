import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import HowItWorks from "@/components/landing/HowItWorks";
import Actions from "@/components/landing/Actions";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">

      <Hero />


      <div className="mx-auto max-w-7xl px-4">
        <About />
        <HowItWorks />
        <Actions />
      </div>

    </main>
  );
}
