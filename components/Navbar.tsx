
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow">
      <Link
        href="/"
        className="text-xl font-bold text-blue-700"
      >
        Spin4Chinuch
      </Link>

      <div className="flex gap-4">
        <Link
          href="/spin"
          className="text-gray-700"
        >
          Spin
        </Link>

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Login
        </button>
      </div>
    </nav>
  );
}