import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import HowItWorks from "@/components/landing/HowItWorks";
import Actions from "@/components/landing/Actions";
import Contact from "@/components/landing/Contact";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-white text-[#142A52]">
      <Hero />
      <About />
      <div className="border-y border-[#E3EAF4] bg-[#F4F7FC]">
        <HowItWorks />
      </div>
      <Actions />
      <Contact />
    </main>
  );
}
