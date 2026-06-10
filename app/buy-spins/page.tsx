export default function BuySpinsPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-10 rounded-3xl shadow-lg text-center">

        <h1 className="text-4xl font-bold mb-6">
          Buy Spins
        </h1>

        <div className="space-y-4">

          <button className="w-full bg-green-600 text-white p-4 rounded-xl">
            10 Spins - $10
          </button>

          <button className="w-full bg-blue-600 text-white p-4 rounded-xl">
            25 Spins - $20
          </button>

          <button className="w-full bg-purple-600 text-white p-4 rounded-xl">
            50 Spins - $35
          </button>

        </div>

      </div>
    </main>
  );
}