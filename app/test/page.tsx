import Navbar from "@/components/Navbar";

export default function TestPage() {
  return (
    <>
      <Navbar />
      <main className="cy-page px-6 py-16">
        <section className="cy-container">
          <div className="cy-card rounded-[2rem] p-10 text-center">
            <p className="cy-kicker">System check</p>
            <h1 className="cy-heading mt-3 text-4xl">Spin4Chinuch is ready</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              This internal page now follows the Chinuch Yehudi visual theme without exposing environment configuration.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
