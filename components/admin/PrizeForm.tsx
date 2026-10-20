"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { giftCardRequest } from "@/components/admin/GiftCards";
import PrizeLogoUpload from "@/components/admin/PrizeLogoUpload";

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
  notification_email: string;
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
  notification_email: "",
};

export default function PrizeForm({ prizeId, initialValues = emptyPrize, notificationsReady }: { prizeId?: number; initialValues?: PrizeFormValues; notificationsReady?: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState(() => ({ ...emptyPrize, ...initialValues, notification_email: initialValues.notification_email ?? "" }));
  const [loading, setLoading] = useState(false);
  const [detectedNotifications, setDetectedNotifications] = useState(false);
  const notificationSupported = notificationsReady ?? detectedNotifications;
  useEffect(() => {
    if (notificationsReady !== undefined) return;
    let cancelled = false;
    void supabase.from("prize_contacts").select("notification_email").limit(0).then(({ error }) => {
      if (!cancelled) setDetectedNotifications(!error);
    });
    return () => { cancelled = true; };
  }, [notificationsReady]);
  const savedId = useRef(prizeId);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [pdfs, setPdfs] = useState<File[]>([]);
  useEffect(() => {
    if (!logoPreview) return;
    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  function chooseLogo(files: File[]) {
    if (loading || !files.length) return;
    if (files.length !== 1 || !/\.(png|jpe?g)$/i.test(files[0].name) || files[0].size > 3 * 1024 * 1024) return toast.error("Choose one PNG or JPG up to 3 MB.");
    setLogo(files[0]);
    setLogoPreview(URL.createObjectURL(files[0]));
  }

  function choosePdfs(files: File[]) {
    if (loading) return;
    if (files.some(file => !/\.pdf$/i.test(file.name) || file.size > 3 * 1024 * 1024)) return toast.error("Choose PDFs up to 3 MB each.");
    setPdfs(current => [...current, ...files]);
  }

  function update<K extends keyof PrizeFormValues>(key: K, value: PrizeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function savePrize(event: FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) return toast.error("Please enter a prize name.");
    if (!Number.isInteger(values.quantity) || values.quantity < 0) return toast.error("Quantity must be a non-negative whole number.");
    if (values.retail_value !== null && (!Number.isFinite(values.retail_value) || values.retail_value < 0)) return toast.error("Retail value cannot be negative.");

    if (loading) return;
    const prizeId = savedId.current;
    setLoading(true);
    try {
      const payload = {
        name: values.name.trim(),
        active: values.active,
        ...(!prizeId || values.image_url !== initialValues.image_url
          ? { image_url: values.image_url.trim() || null }
          : {}),
        retail_value: values.retail_value,
        sponsor_name: values.sponsor_name.trim() || null,
        delivery_type: values.delivery_type.trim() || null,
        delivery_instructions: values.delivery_instructions.trim() || null,
      };
      async function save() {
        if (!prizeId) {
          return supabase.from("prizes").insert({ ...payload, quantity: values.quantity }).select("id").single();
        }
        // Editing other fields must never restore inventory already awarded.
        if (values.quantity === initialValues.quantity) {
          return supabase.from("prizes").update(payload).eq("id", prizeId).select("id").single();
        }
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data: current, error } = await supabase.from("prizes")
            .select("*,wins!prize_id(count)").eq("id", prizeId).single();
          if (error) return { data: null, error };
          const awarded = current.wins[0]?.count ?? 0;
          if (values.quantity < awarded) {
            return { data: null, error: { message: `Original quantity cannot be less than the ${awarded} prizes already won.` } };
          }
          const result = await supabase.from("prizes").update({
            ...payload,
            quantity: values.quantity - awarded,
            ...(current.original_quantity != null ? { original_quantity: values.quantity } : {}),
          }).eq("id", prizeId).eq("quantity", current.quantity).select("id").maybeSingle();
          if (result.error || result.data) return result;
        }
        return { data: null, error: { message: "Prize stock changed while saving. Please try again." } };
      }
      const result = await save();
      if (result.error) { setLoading(false); return toast.error(result.error.message); }

      const savedPrizeId = result.data!.id;
      savedId.current = savedPrizeId;
      if (logo) {
        const form = new FormData();
        form.set("prizeId", String(savedPrizeId));
        form.set("file", logo);
        const uploaded = await giftCardRequest("/api/admin/prize-logo", { method: "POST", body: form });
        update("image_url", uploaded.imageUrl);
        setLogo(null);
        setLogoPreview("");
      }
      for (const file of pdfs) {
        const form = new FormData();
        form.set("prizeId", String(savedPrizeId));
        form.set("file", file);
        await giftCardRequest("/api/admin/gift-cards", { method: "POST", body: form });
        setPdfs(current => current.filter(item => item !== file));
      }
      const contactName = values.contact_name.trim();
      const contactEmail = values.contact_email.trim();
      const notificationEmail = (values.notification_email ?? "").trim();
      const contactResult = contactName || contactEmail || notificationEmail
        ? await supabase.from("prize_contacts").upsert({
            prize_id: savedPrizeId,
            contact_name: contactName || null,
            contact_email: contactEmail || null,
            ...(notificationSupported ? { notification_email: notificationEmail || null } : {}),
            updated_at: new Date().toISOString(),
          })
        : await supabase.from("prize_contacts").delete().eq("prize_id", savedPrizeId);
      setLoading(false);
      if (contactResult.error) return toast.error(`Prize saved, but the private contact could not be saved: ${contactResult.error.message}`);
      toast.success(prizeId ? "Prize updated." : "Prize created.");
      router.push("/admin/prizes");
      router.refresh();
    } catch (error) {
      toast.error(`${savedId.current ? "Prize saved. " : ""}${error instanceof Error ? error.message : "Unable to save changes."} Retry saving to finish.`);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#2F6ED8] focus:ring-4 focus:ring-blue-100";
  return (
    <form onSubmit={savePrize} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
      <fieldset disabled={loading} className="min-w-0 border-0 p-0">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="font-semibold md:col-span-2">Prize Name<input required value={values.name} onChange={(event) => update("name", event.target.value)} className={inputClass} placeholder="Amazon Gift Card" /></label>
        <label className="font-semibold">Original Quantity<input required type="number" min={0} step={1} value={values.quantity} onChange={(event) => update("quantity", Number(event.target.value))} className={inputClass} /><span className="mt-2 block text-sm font-normal text-slate-500">Total prizes offered, including those already won.</span></label>
        <label className="font-semibold">Retail Value<input type="number" min={0} step="0.01" value={values.retail_value ?? ""} onChange={(event) => update("retail_value", event.target.value === "" ? null : Number(event.target.value))} className={inputClass} placeholder="Optional" /></label>
        <label className="font-semibold">Sponsor Name<input value={values.sponsor_name} onChange={(event) => update("sponsor_name", event.target.value)} className={inputClass} placeholder="Optional" /></label>
        <div className="font-semibold">
          <label>Prize Picture<input type="text" value={values.image_url} onChange={(event) => update("image_url", event.target.value)} className={inputClass} placeholder="/prizes/photo.jpg or https://…" /></label>
          {prizeId ? <>
            <div className="relative mt-3 h-64 overflow-hidden rounded-2xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {values.image_url && <img src={values.image_url} alt="Current prize logo" className="h-full w-full object-contain p-4" />}
              <PrizeLogoUpload prizeId={prizeId} name={values.name} onUploaded={url => update("image_url", url)} />
            </div>
            <p className="mt-2 text-sm font-normal text-slate-500">Dropped logos save immediately.</p>
          </> : <div className="mt-3 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-4"
            onDragOver={event => event.preventDefault()}
            onDrop={event => { event.preventDefault(); chooseLogo(Array.from(event.dataTransfer.files)); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoPreview && <img src={logoPreview} alt="Selected prize picture" className="mb-3 h-40 w-full object-contain" />}
            <label className="block text-sm">Drop a picture here or choose a file
              <input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" className="mt-3 block w-full" onChange={event => { chooseLogo(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
            </label>
            {logo && <button type="button" onClick={() => { setLogo(null); setLogoPreview(""); }} className="mt-2 text-sm underline">Remove {logo.name}</button>}
            <p className="mt-2 text-sm font-normal text-slate-500">PNG/JPG up to 3 MB. Uploads when you create the prize.</p>
          </div>}
        </div>
        <label className="font-semibold">Delivery Type<input value={values.delivery_type} onChange={(event) => update("delivery_type", event.target.value)} className={inputClass} placeholder="Pickup, email, shipping…" /></label>
        <label className="font-semibold md:col-span-2">Delivery Instructions<textarea value={values.delivery_instructions} onChange={(event) => update("delivery_instructions", event.target.value)} className={`${inputClass} min-h-28 resize-y`} placeholder="Internal fulfillment notes" /></label>
        <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <p className="font-bold text-[#142A52]">Private prize contact</p>
          <p className="mt-1 text-sm text-slate-500">Only administrators can view this information.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="font-semibold">Contact Name<input value={values.contact_name} onChange={(event) => update("contact_name", event.target.value)} className={inputClass} placeholder="Optional" /></label>
            <label className="font-semibold">Contact Email<input type="email" value={values.contact_email} onChange={(event) => update("contact_email", event.target.value)} className={inputClass} placeholder="Optional" /></label>
            <label className="font-semibold md:col-span-2">Sponsor notification email<input disabled={!notificationSupported} type="email" value={values.notification_email ?? ""} onChange={(event) => update("notification_email", event.target.value)} className={inputClass} placeholder="Optional sponsor email address" /><span className="mt-2 block text-sm font-normal text-slate-500">{!notificationSupported && "Sponsor notifications require database setup. "}For wins without an attached PDF, send this address the winner name, email, and prize so the sponsor can deliver it directly. The winner still receives the usual email. Leave blank to disable.</span></label>
          </div>
        </div>
      </div>
      {!prizeId && <section className="mt-6 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-5"
        onDragOver={event => event.preventDefault()}
        onDrop={event => { event.preventDefault(); choosePdfs(Array.from(event.dataTransfer.files)); }}>
        <h2 className="font-bold">E-gift card PDFs</h2>
        <p className="mt-2 text-sm text-slate-600">Drop PDFs here or choose files. Use a different redeemable card for each winner, up to 3 MB per PDF. Files upload when you create the prize.</p>
        <input type="file" multiple accept="application/pdf,.pdf" aria-label="Gift card PDFs" className="mt-3 block w-full" onChange={event => { choosePdfs(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
        <ul className="mt-3 space-y-2">{pdfs.map((file, index) => <li key={index} className="flex items-center justify-between gap-3 text-sm"><span className="break-all">{file.name}</span><button type="button" onClick={() => setPdfs(current => current.filter((_, i) => i !== index))} className="shrink-0 underline">Remove</button></li>)}</ul>
      </section>}
      <label className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-semibold"><input type="checkbox" checked={values.active} onChange={(event) => update("active", event.target.checked)} className="h-5 w-5" /> Prize is active</label>
      </fieldset>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin/prizes" className="rounded-full border border-slate-200 px-6 py-3 text-center font-bold">Cancel</Link>
        <button disabled={loading} type="submit" className="rounded-full bg-[#2F6ED8] px-7 py-3 font-bold text-white shadow-lg disabled:opacity-50">{loading ? "Saving…" : prizeId ? "Save Changes" : "Create Prize"}</button>
      </div>
    </form>
  );
}
