"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export type PrizeFormValues = {
  name: string;
  quantity: number;
  active: boolean;
  image_url: string;
  retail_value: number | null;
  sponsor_name: string;
  delivery_type: string;
  delivery_instructions: string;
  contact_name: string;
  contact_email: string;
};

const emptyPrize: PrizeFormValues = {
  name: "",
  quantity: 1,
  active: true,
  image_url: "",
  retail_value: null,
  sponsor_name: "",
  delivery_type: "",
  delivery_instructions: "",
  contact_name: "",
  contact_email: "",
};

export default function PrizeForm({ prizeId, initialValues = emptyPrize }: { prizeId?: number; initialValues?: PrizeFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof PrizeFormValues>(key: K, value: PrizeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function savePrize(event: FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) return toast.error("Please enter a prize name.");
    if (!Number.isInteger(values.quantity) || values.quantity < 0) return toast.error("Quantity must be a non-negative whole number.");
    if (values.retail_value !== null && (!Number.isFinite(values.retail_value) || values.retail_value < 0)) return toast.error("Retail value cannot be negative.");

    setLoading(true);
    const payload = {
      name: values.name.trim(),
      quantity: values.quantity,
      active: values.active,
      image_url: values.image_url.trim() || null,
      retail_value: values.retail_value,
      sponsor_name: values.sponsor_name.trim() || null,
      delivery_type: values.delivery_type.trim() || null,
      delivery_instructions: values.delivery_instructions.trim() || null,
    };
    const result = prizeId
      ? await supabase.from("prizes").update(payload).eq("id", prizeId).select("id").single()
      : await supabase.from("prizes").insert(payload).select("id").single();
    if (result.error) { setLoading(false); return toast.error(result.error.message); }

    const savedPrizeId = result.data.id;
    const contactName = values.contact_name.trim();
    const contactEmail = values.contact_email.trim();
    const contactResult = contactName || contactEmail
      ? await supabase.from("prize_contacts").upsert({
          prize_id: savedPrizeId,
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          updated_at: new Date().toISOString(),
        })
      : await supabase.from("prize_contacts").delete().eq("prize_id", savedPrizeId);
    setLoading(false);
    if (contactResult.error) return toast.error(`Prize saved, but the private contact could not be saved: ${contactResult.error.message}`);
    toast.success(prizeId ? "Prize updated." : "Prize created.");
    router.push("/admin/prizes");
    router.refresh();
  }

  const inputClass = "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#2F6ED8] focus:ring-4 focus:ring-blue-100";
  return (
    <form onSubmit={savePrize} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="font-semibold md:col-span-2">Prize Name<input required value={values.name} onChange={(event) => update("name", event.target.value)} className={inputClass} placeholder="Amazon Gift Card" /></label>
        <label className="font-semibold">Quantity<input required type="number" min={0} step={1} value={values.quantity} onChange={(event) => update("quantity", Number(event.target.value))} className={inputClass} /></label>
        <label className="font-semibold">Retail Value<input type="number" min={0} step="0.01" value={values.retail_value ?? ""} onChange={(event) => update("retail_value", event.target.value === "" ? null : Number(event.target.value))} className={inputClass} placeholder="Optional" /></label>
        <label className="font-semibold">Sponsor Name<input value={values.sponsor_name} onChange={(event) => update("sponsor_name", event.target.value)} className={inputClass} placeholder="Optional" /></label>
        <label className="font-semibold">Image URL<input type="url" value={values.image_url} onChange={(event) => update("image_url", event.target.value)} className={inputClass} placeholder="https://…" /></label>
        <label className="font-semibold">Delivery Type<input value={values.delivery_type} onChange={(event) => update("delivery_type", event.target.value)} className={inputClass} placeholder="Pickup, email, shipping…" /></label>
        <label className="font-semibold md:col-span-2">Delivery Instructions<textarea value={values.delivery_instructions} onChange={(event) => update("delivery_instructions", event.target.value)} className={`${inputClass} min-h-28 resize-y`} placeholder="Internal fulfillment notes" /></label>
        <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <p className="font-bold text-[#142A52]">Private prize contact</p>
          <p className="mt-1 text-sm text-slate-500">Only administrators can view this information.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="font-semibold">Contact Name<input value={values.contact_name} onChange={(event) => update("contact_name", event.target.value)} className={inputClass} placeholder="Optional" /></label>
            <label className="font-semibold">Contact Email<input type="email" value={values.contact_email} onChange={(event) => update("contact_email", event.target.value)} className={inputClass} placeholder="Optional" /></label>
          </div>
        </div>
      </div>
      <label className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-semibold"><input type="checkbox" checked={values.active} onChange={(event) => update("active", event.target.checked)} className="h-5 w-5" /> Prize is active</label>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin/prizes" className="rounded-full border border-slate-200 px-6 py-3 text-center font-bold">Cancel</Link>
        <button disabled={loading} type="submit" className="rounded-full bg-[#2F6ED8] px-7 py-3 font-bold text-white shadow-lg disabled:opacity-50">{loading ? "Saving…" : prizeId ? "Save Changes" : "Create Prize"}</button>
      </div>
    </form>
  );
}
