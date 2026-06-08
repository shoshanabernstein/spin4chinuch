import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <Link
        href="/"
        className="text-2xl font-extrabold text-blue-700"
      >
        Spin4Chinuch
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/spin"
          className="text-gray-700 hover:text-blue-600 transition"
        >
          Spin
        </Link>

        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-xl shadow-lg hover:scale-105 transition">
          Login
        </button>
      </div>
    </nav>
  );
}