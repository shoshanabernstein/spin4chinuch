export default function SpinPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">

      <div className="text-center">

        <h1 className="text-5xl font-bold mb-8">
          Spin The Wheel
        </h1>

        <div className="w-80 h-80 rounded-full border-8 border-blue-600 flex items-center justify-center text-3xl font-bold">
          🎡
        </div>

        <button className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl">
          SPIN
        </button>

      </div>

    </main>
  );
}