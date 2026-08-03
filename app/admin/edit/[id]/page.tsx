"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import PrizeForm, { PrizeFormValues } from "@/components/admin/PrizeForm";
import { supabase } from "@/lib/supabase";

export default function EditPrizePage() {
  const params = useParams<{ id: string }>();
  const prizeId = Number(params.id);
  const [prize, setPrize] = useState<PrizeFormValues | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function loadPrize() {
      if (!Number.isInteger(prizeId)) { setFailed(true); return; }
      const { data, error } = await supabase.from("prizes").select("name,quantity,active,image_url,retail_value,sponsor_name,delivery_type,delivery_instructions").eq("id", prizeId).single();
      if (error) { toast.error("Prize not found."); setFailed(true); return; }
      setPrize({
        name: data.name,
        quantity: data.quantity,
        active: data.active,
        image_url: data.image_url ?? "",
        retail_value: data.retail_value,
        sponsor_name: data.sponsor_name ?? "",
        delivery_type: data.delivery_type ?? "",
        delivery_instructions: data.delivery_instructions ?? "",
      });
    }
    void loadPrize();
  }, [prizeId]);

  return (
    <main className="app-page">
      <div className="app-container max-w-4xl">
        <section className="page-hero">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4267A8]">Prize Management</p>
          <h1 className="mt-1 text-4xl font-black">Edit Prize</h1>
          <p className="mt-2 text-slate-500">Update inventory, presentation, and fulfillment details.</p>
        </section>
        {failed ? <div className="rounded-3xl bg-white py-16 text-center text-slate-500 shadow-lg">This prize could not be loaded.</div> : prize ? <PrizeForm prizeId={prizeId} initialValues={prize} /> : <div className="rounded-3xl bg-white py-16 text-center text-slate-500 shadow-lg">Loading prize…</div>}
      </div>
    </main>
  );
}
