import Navbar from "../components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-blue-700">
            Spin4Chinuch
          </h1>

          <p className="mt-4 text-xl text-gray-600">
            Support Torah education and win prizes.
          </p>

          <button className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Link
          href="/spin"
          className="mt-8 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Buy Spins
          </Link>
          </button>
        </div>
      </main>
    </>
  );
}