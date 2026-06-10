export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-blue-50 p-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-5xl font-bold mb-8">
          Dashboard
        </h1>

        <div className="bg-white rounded-3xl p-8 shadow-lg">

          <h2 className="text-2xl font-bold">
            Welcome to Spin4Chinuch
          </h2>

          <p className="mt-4 text-gray-600">
            Available Spins
          </p>

          <p className="text-6xl font-bold text-blue-600 mt-2">
            0
          </p>

          <div className="flex gap-4 mt-8">
            <button className="bg-green-600 text-white px-6 py-3 rounded-xl">
              Buy Spins
            </button>

            <button className="bg-purple-600 text-white px-6 py-3 rounded-xl">
              Spin Wheel
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}