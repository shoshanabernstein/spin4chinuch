import PrizeForm from "@/components/admin/PrizeForm";

export default function NewPrizePage() {
  return (
    <main className="app-page">
      <div className="app-container max-w-4xl">
        <section className="page-hero">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4267A8]">Prize Management</p>
          <h1 className="mt-1 text-4xl font-black">Add Prize</h1>
          <p className="mt-2 text-slate-500">Create a prize and configure its inventory and fulfillment details.</p>
        </section>
        <PrizeForm />
      </div>
    </main>
  );
}
