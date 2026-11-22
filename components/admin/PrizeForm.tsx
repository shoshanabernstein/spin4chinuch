"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { giftCardRequest } from "@/components/admin/GiftCards";
import PrizeLogoUpload from "@/components/admin/PrizeLogoUpload";
import { getPrizeDisplay } from "@/lib/prize-display";

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

/** Builds the stored prize name from its two display parts, matching how getPrizeDisplay splits names. */
export function composePrizeName(title: string, provider: string) {
  const what = title.trim().replace(/\s+/g, " ");
  const from = provider.trim().replace(/\s+/g, " ");
  if (!from) return what;
  const giftCard = what.match(/^(\$[\d,.]+)\s+gift cards?$/i);
  if (giftCard) return `${giftCard[1]} ${from} Gift Card`;
  return `${what} by ${from}`;
}

export default function PrizeForm({ prizeId, initialValues = emptyPrize, notificationsReady, awarded = 0 }: { prizeId?: number; initialValues?: PrizeFormValues; notificationsReady?: boolean; awarded?: number }) {
  const router = useRouter();
  const [values, setValues] = useState(() => ({ ...emptyPrize, ...initialValues, notification_email: initialValues.notification_email ?? "" }));
  const [loading, setLoading] = useState(false);
  const [nameParts, setNameParts] = useState(() => {
    const parts = getPrizeDisplay(initialValues.name ?? "", initialValues.sponsor_name);
    const fromName = parts.provider && (initialValues.name ?? "").toLowerCase().includes(parts.provider.toLowerCase());
    return { title: initialValues.name ? parts.title : "", provider: fromName ? parts.provider ?? "" : "" };
  });
  function updateNamePart(part: "title" | "provider", value: string) {
    const next = { ...nameParts, [part]: value };
    setNameParts(next);
    setValues((current) => ({ ...current, name: composePrizeName(next.title, next.provider) }));
  }
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

  const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-[#2F6ED8] focus:ring-4 focus:ring-blue-100";
  const label = "block text-sm font-semibold text-slate-700";
  const hint = "mt-1 block text-xs font-normal text-slate-500";
  const won = prizeId ? awarded : 0;
  const left = Math.max(0, (Number.isFinite(values.quantity) ? values.quantity : 0) - won);
  const box = "rounded-2xl border border-slate-200 p-5";
  const boxTitle = "mb-3 text-base font-black text-[#142A52]";
  return (
    <form onSubmit={savePrize} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg sm:p-6">
      <fieldset disabled={loading} className="min-w-0 space-y-5 border-0 p-0">

        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
          <section className={box}>
            <h2 className={boxTitle}>Prize</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Prize <span className="font-normal text-slate-400">(for example: $5 Gift Card, Massage, Full Face)</span></span>
                  <input required value={nameParts.title} onChange={(event) => updateNamePart("title", event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg font-bold text-[#142A52] outline-none focus:border-[#2F6ED8] focus:ring-4 focus:ring-blue-100" placeholder="e.g. $5 Gift Card" />
                </label>
                <span aria-hidden="true" className="my-3 block h-0.5 w-10 rounded-full bg-[#C9A44D]" />
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">From <span className="font-normal text-slate-400">(for example: Target, Marcys, Piccolino)</span></span>
                  <input value={nameParts.provider} onChange={(event) => updateNamePart("provider", event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-[#2F6ED8] focus:ring-4 focus:ring-blue-100" placeholder="e.g. Target" />
                </label>
                <p className={hint}>Full name: <b className="text-slate-700">{values.name || "—"}</b></p>
              </div>
              <label className={label}>Donated by<input value={values.sponsor_name} onChange={(event) => update("sponsor_name", event.target.value)} className={inputClass} placeholder="Sponsor name (optional)" /></label>
              <label className={label}>Value
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3 top-1/2 mt-[3px] -translate-y-1/2 font-normal text-slate-400">$</span>
                  <input type="number" min={0} step="0.01" value={values.retail_value ?? ""} onChange={(event) => update("retail_value", event.target.value === "" ? null : Number(event.target.value))} className={`${inputClass} pl-7`} placeholder="Optional" />
                </span>
              </label>
              <label className={label}>Total being given away<input required type="number" min={0} step={1} value={values.quantity} onChange={(event) => update("quantity", Number(event.target.value))} className={inputClass} />
                {prizeId ? <span className={hint}><b className="text-slate-700">{won}</b> won · <b className="text-[#2F6ED8]">{left}</b> still available</span> : <span className={hint}>Including any already won.</span>}
              </label>
              <div className={label}>On the site
                <label className={`mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${values.active ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  <input type="checkbox" checked={values.active} onChange={(event) => update("active", event.target.checked)} className="h-4 w-4 accent-green-600" />
                  {values.active ? "Showing" : "Hidden"}
                </label>
              </div>
            </div>
          </section>

          <section className={box}>
            <h2 className={boxTitle}>Picture</h2>
            {prizeId ? <>
              <div className="relative h-40 overflow-hidden rounded-xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {values.image_url && <img src={values.image_url} alt="Current prize logo" className="h-full w-full object-contain p-3" />}
                <PrizeLogoUpload prizeId={prizeId} name={values.name} onUploaded={url => update("image_url", url)} />
              </div>
              <p className={hint}>Drop a new picture on it to replace. Saves right away.</p>
            </> : <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-3 text-sm"
              onDragOver={event => event.preventDefault()}
              onDrop={event => { event.preventDefault(); chooseLogo(Array.from(event.dataTransfer.files)); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logoPreview && <img src={logoPreview} alt="Selected prize picture" className="mb-2 h-28 w-full object-contain" />}
              <label className="block">Drop a picture or choose a file
                <input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" className="mt-2 block w-full text-xs" onChange={event => { chooseLogo(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
              </label>
              {logo && <button type="button" onClick={() => { setLogo(null); setLogoPreview(""); }} className="mt-2 underline">Remove {logo.name}</button>}
              <p className={hint}>PNG or JPG, up to 3 MB.</p>
            </div>}
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-slate-500">Use a web address instead</summary>
              <input type="text" value={values.image_url} onChange={(event) => update("image_url", event.target.value)} className={inputClass} placeholder="https://…" />
            </details>
          </section>
        </div>

        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="text-base font-black text-[#142A52]">How does the winner get this prize?</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white p-4 text-sm">
              <p className="font-bold text-[#2F6ED8]">Option 1 · We send the gift card</p>
              <p className="mt-1 text-slate-600">Upload the actual gift card PDFs {prizeId ? "in the \"E-gift card PDFs\" box below" : "in the box at the bottom"}. Each winner is emailed one PDF automatically.</p>
            </div>
            <div className="rounded-xl bg-white p-4 text-sm">
              <p className="flex items-center justify-between gap-2 font-bold text-[#2F6ED8]">Option 2 · The vendor delivers it
                <span className={`rounded-full px-2 py-0.5 text-xs ${(values.notification_email ?? "").trim() ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{(values.notification_email ?? "").trim() ? "On" : "Off"}</span>
              </p>
              <p className="mt-1 text-slate-600">Fill in &quot;Email the vendor when someone wins&quot; below. The winner is told we&apos;ll be in touch, and the vendor gets the winner&apos;s name, email and phone to deliver it.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className={box}>
            <h2 className={boxTitle}>Delivery <span className="text-xs font-normal text-slate-500">(private)</span></h2>
            <div className="grid gap-4">
              <label className={label}>How it&apos;s delivered<input list="delivery-types" value={values.delivery_type} onChange={(event) => update("delivery_type", event.target.value)} className={inputClass} placeholder="Pick or type" />
                <datalist id="delivery-types"><option value="Email" /><option value="E-gift card PDF" /><option value="Vendor contacts winner" /><option value="Pickup" /><option value="Shipping" /></datalist>
              </label>
              <label className={label}>Notes<textarea value={values.delivery_instructions} onChange={(event) => update("delivery_instructions", event.target.value)} className={`${inputClass} min-h-20 resize-y`} placeholder="Optional" /></label>
            </div>
          </section>

          <section className={`${box} border-blue-100 bg-blue-50/50`}>
            <h2 className={boxTitle}>Vendor contact <span className="text-xs font-normal text-slate-500">(private)</span></h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Name<input value={values.contact_name} onChange={(event) => update("contact_name", event.target.value)} className={inputClass} placeholder="Optional" /></label>
              <label className={label}>Email<input type="email" value={values.contact_email} onChange={(event) => update("contact_email", event.target.value)} className={inputClass} placeholder="For tax receipts" /></label>
              <label className={`${label} sm:col-span-2`}><span className="mr-1 text-xs font-bold uppercase tracking-wide text-[#2F6ED8]">Option 2 ·</span>Email the vendor when someone wins<input disabled={!notificationSupported} type="email" value={values.notification_email ?? ""} onChange={(event) => update("notification_email", event.target.value)} className={inputClass} placeholder="Leave blank to turn off" />
                <span className={hint}>{!notificationSupported && "Needs database setup first. "}The vendor gets the winner&apos;s name, email and phone. If the winner already got a PDF gift card, the email tells the vendor there&apos;s nothing to send.</span>
              </label>
            </div>
          </section>
        </div>

        {!prizeId && <section className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-5"
          onDragOver={event => event.preventDefault()}
          onDrop={event => { event.preventDefault(); choosePdfs(Array.from(event.dataTransfer.files)); }}>
          <h2 className={boxTitle}><span className="mr-1 text-xs font-bold uppercase tracking-wide text-[#2F6ED8]">Option 1 ·</span>E-gift card PDFs (the actual gift cards)</h2>
          <p className="text-sm text-slate-600">Drop PDFs here or choose files. A different card for each winner, up to 3 MB each. They upload when you create the prize.</p>
          <input type="file" multiple accept="application/pdf,.pdf" aria-label="Gift card PDFs" className="mt-3 block w-full" onChange={event => { choosePdfs(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
          <ul className="mt-3 space-y-2">{pdfs.map((file, index) => <li key={index} className="flex items-center justify-between gap-3 text-sm"><span className="break-all">{file.name}</span><button type="button" onClick={() => setPdfs(current => current.filter((_, i) => i !== index))} className="shrink-0 underline">Remove</button></li>)}</ul>
        </section>}
      </fieldset>
      <div className="sticky bottom-4 z-10 mt-6 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-end">
        <Link href="/admin/prizes" className="rounded-full border border-slate-200 px-6 py-2.5 text-center font-bold">Cancel</Link>
        <button disabled={loading} type="submit" className="rounded-full bg-[#2F6ED8] px-7 py-2.5 font-bold text-white shadow-lg disabled:opacity-50">{loading ? "Saving…" : prizeId ? "Save Changes" : "Create Prize"}</button>
      </div>
    </form>
  );
}
