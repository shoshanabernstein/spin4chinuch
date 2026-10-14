"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export async function giftCardRequest(url: string, init?: RequestInit) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Please sign in again.");
  const response = await fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${data.session.access_token}` } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Unable to update gift cards.");
  return body;
}

type Card = { id: string; filename: string; win_id: number | null; sent_at: string | null; last_error: string | null };

export async function downloadGiftCard(id: string) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Please sign in again.");
  const response = await fetch(`/api/admin/gift-cards/download?id=${id}`, { headers: { Authorization: `Bearer ${data.session.access_token}` } });
  if (!response.ok) throw new Error("Unable to download the PDF.");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "gift-card.pdf";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function GiftCards({ prizeId }: { prizeId: number }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const body = await giftCardRequest(`/api/admin/gift-cards?prizeId=${prizeId}`);
    setEnabled(body.enabled);
    setCards(body.cards);
    setLoaded(true);
  }, [prizeId]);
  useEffect(() => {
    let cancelled = false;
    giftCardRequest(`/api/admin/gift-cards?prizeId=${prizeId}`).then(body => {
      if (cancelled) return;
      setEnabled(body.enabled);
      setCards(body.cards);
      setLoaded(true);
    }).catch(() => { if (!cancelled) setMessage("Unable to load gift cards. Please refresh the page."); });
    return () => { cancelled = true; };
  }, [prizeId]);

  async function upload(files: File[]) {
    setBusy(true);
    setMessage("");
    let count = 0;
    try {
      for (const file of files) {
        const form = new FormData();
        form.set("prizeId", String(prizeId));
        form.set("file", file);
        await giftCardRequest("/api/admin/gift-cards", { method: "POST", body: form });
        count++;
      }
      setMessage(`${count} gift card PDF${count === 1 ? "" : "s"} uploaded and ready for future wins.`);
    } catch (error) {
      setMessage(`${count} uploaded. ${error instanceof Error ? error.message : "Upload failed."}`);
    } finally {
      await load().catch(() => setMessage("Please refresh to check which PDFs were saved."));
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await giftCardRequest(`/api/admin/gift-cards?id=${id}`, { method: "DELETE" });
      await load();
      setMessage("Unused gift card removed.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Removal failed."); }
    finally { setBusy(false); }
  }

  return <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
    <h2 className="text-xl font-bold">E-gift card PDFs</h2>
    <p className="mt-2 text-sm text-slate-600">Upload a separate PDF for each individual gift card. Each PDF goes to one future winner only. If no unused PDF is available, the usual prize email is sent. Uploads are saved immediately.</p>
    <p className="mt-2 text-sm text-slate-600">Each PDF must contain a different redeemable card. Uploading a re-saved copy of the same card could give two winners the same redemption code.</p>
    {loaded && !enabled && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm">PDF delivery is awaiting database setup. Existing prize emails are unchanged.</p>}
    {enabled && <>
      <p className="mt-4 font-semibold">{cards.filter(card => !card.win_id).length} available · {cards.filter(card => card.win_id && !card.sent_at).length} reserved · {cards.filter(card => card.sent_at).length} emailed</p>
      <div className="mt-4">
        <input ref={fileInput} type="file" aria-label="Gift card PDFs" accept="application/pdf,.pdf" multiple disabled={busy} className="hidden" onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) void upload(files); }} />
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="rounded-full bg-[#2F6ED8] px-6 py-3 font-bold text-white shadow-lg transition hover:bg-[#255bb5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Saving PDFs…" : "Upload Gift Card PDFs"}
        </button>
        <p className="mt-2 text-sm text-slate-500">Choose one or more PDFs, up to 3 MB each. Uploads save automatically.</p>
      </div>
      <ul className="mt-4 divide-y divide-slate-100">{cards.map(card => <li key={card.id} className="flex items-center justify-between gap-3 py-3 text-sm">
        <div className="min-w-0"><p className="break-words font-semibold">{card.filename}</p><p className="text-slate-500">{card.sent_at ? "Emailed" : card.win_id ? "Reserved for a winner" : "Available"}</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => void downloadGiftCard(card.id).catch(() => setMessage("Unable to download the PDF."))} className="rounded-full border px-3 py-2">Download</button>{!card.win_id && <button type="button" disabled={busy} onClick={() => void remove(card.id)} className="rounded-full border px-3 py-2 disabled:opacity-50">Remove</button>}</div>
      </li>)}</ul>
    </>}
    <p role="status" className="mt-3 text-sm text-slate-600">{busy ? "Saving gift cards…" : message}</p>
  </section>;
}
