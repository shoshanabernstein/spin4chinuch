import Link from "next/link";
import Navbar from "../components/Navbar";
import {
  Gift,
  Trophy,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

        {/* HERO SECTION */}
        <section className="px-6 py-24 text-center">
          <div className="max-w-4xl mx-auto">

            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              🎉 Support Torah Education While Winning Prizes
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 leading-tight">
              Spin.
              Win.
              Support Chinuch.
            </h1>

            <p className="mt-8 text-xl text-gray-600 max-w-2xl mx-auto">
              Every spin helps nonprofit Torah education while giving supporters
              a chance to win amazing prizes instantly.
            </p>

            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/spin"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-xl hover:scale-105 transition"
              >
                Start Spinning
              </Link>

              <button className="px-8 py-4 rounded-2xl bg-white border border-gray-300 font-semibold hover:bg-gray-100 transition">
                View Prizes
              </button>
            </div>

          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

            <div className="bg-white rounded-3xl p-8 shadow-lg border">
              <Gift className="w-12 h-12 text-blue-600" />

              <h3 className="mt-6 text-2xl font-bold">
                Amazing Prizes
              </h3>

              <p className="mt-4 text-gray-600">
                Win gift cards, sponsor rewards, free spins, and exclusive prizes.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border">
              <Sparkles className="w-12 h-12 text-purple-600" />

              <h3 className="mt-6 text-2xl font-bold">
                Instant Wins
              </h3>

              <p className="mt-4 text-gray-600">
                Spin the wheel and instantly discover your reward.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border">
              <Trophy className="w-12 h-12 text-yellow-500" />

              <h3 className="mt-6 text-2xl font-bold">
                Support Chinuch
              </h3>

              <p className="mt-4 text-gray-600">
                Every spin directly supports Torah education initiatives.
              </p>
            </div>

          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-6 py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto text-center">

            <h2 className="text-5xl font-bold text-gray-900">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-10 mt-16">

              <div>
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                  1
                </div>

                <h3 className="mt-6 text-2xl font-bold">
                  Buy Spins
                </h3>

                <p className="mt-3 text-gray-600">
                  Purchase spins to support nonprofit Torah education.
                </p>
              </div>

              <div>
                <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                  2
                </div>

                <h3 className="mt-6 text-2xl font-bold">
                  Spin the Wheel
                </h3>

                <p className="mt-3 text-gray-600">
                  Watch the wheel spin and reveal your prize instantly.
                </p>
              </div>

              <div>
                <div className="w-16 h-16 rounded-full bg-yellow-500 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                  3
                </div>

                <h3 className="mt-6 text-2xl font-bold">
                  Win Rewards
                </h3>

                <p className="mt-3 text-gray-600">
                  Claim digital prizes, gift cards, and sponsor rewards.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>
    </>
  );
}