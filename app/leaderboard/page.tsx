import Navbar from "@/components/Navbar";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <>
      <Navbar />
      <main className="cy-page px-6 py-16">
        <section className="cy-container">
          <div className="cy-card rounded-[2rem] p-10 text-center">
            <Trophy className="mx-auto h-14 w-14 text-[#d6a84f]" />
            <p className="cy-kicker mt-6">Leaderboard</p>
            <h1 className="cy-heading mt-3 text-5xl">Community momentum is coming soon</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              We are preparing a Chinuch Yehudi themed leaderboard to celebrate supporters who help light sparks of Jewish education.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
