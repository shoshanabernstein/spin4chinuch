import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import HowItWorks from "@/components/landing/HowItWorks";
import Actions from "@/components/landing/Actions";
import Contact from "@/components/landing/Contact";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#F9FBFF] via-white to-[#EEF5FF]">

      {/* Background Decorations */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#80A8F7]/20 blur-3xl" />

        <div className="absolute right-0 top-40 h-[420px] w-[420px] rounded-full bg-[#C9A44D]/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#4267A8]/10 blur-3xl" />
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <Hero />
      </div>

      {/* About */}
      <About />

      {/* How It Works */}
      <HowItWorks />

      {/* Call To Action */}
      <Actions />

      {/* Contact */}
      <Contact />

    </main>
  );
}