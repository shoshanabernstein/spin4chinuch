"use client";

import { useCallback, useEffect, useState } from "react";
import { downloadGiftCard, giftCardRequest } from "@/components/admin/GiftCards";

type Delivery = { id: string; win_id: number; prize_name: string; recipient: string; last_error: string | null; first_attempt_at: string | null; lease_until: string | null };

export default function GiftCardDeliveries({ onUpdate }: { onUpdate: () => Promise<void> }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const body = await giftCardRequest("/api/admin/gift-card-deliveries");
    setDeliveries(body.deliveries);
  }, []);
  useEffect(() => {
    let cancelled = false;
    giftCardRequest("/api/admin/gift-card-deliveries").then(body => {
      if (!cancelled) setDeliveries(body.deliveries);
    }).catch(() => { if (!cancelled) setMessage("Unable to check gift card email status. Refresh to retry."); });
    return () => { cancelled = true; };
  }, []);
  async function retry(winId: number) {
    setBusy(true);
    setMessage("");
    try {
      await giftCardRequest("/api/admin/gift-card-deliveries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ winId }) });
      await onUpdate();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to retry."); }
    finally { await load().catch(() => setMessage("Please refresh to check delivery status.")); setBusy(false); }
  }
  if (!deliveries.length && !message) return null;
  return <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
    <h2 className="text-lg font-bold">Gift card emails awaiting confirmation</h2>
    <p className="mt-1 text-sm">These PDFs remain reserved for their winners. Retry sends the same card. After 23 hours, check Resend before emailing the PDF manually and marking the winner fulfilled.</p>
    {deliveries.map(delivery => <div key={delivery.win_id} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 pt-3">
      <div><p className="font-semibold">{delivery.prize_name}</p><p className="text-sm">{delivery.recipient}</p>{delivery.last_error && <p className="mt-1 text-sm">{delivery.last_error}</p>}</div>
      <div className="flex gap-2"><button type="button" onClick={() => void downloadGiftCard(delivery.id).catch(() => setMessage("Unable to download the PDF."))} className="rounded-full border bg-white px-4 py-2 text-sm font-bold">Download PDF</button><button type="button" disabled={busy} onClick={() => void retry(delivery.win_id)} className="rounded-full bg-[#142A52] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Retry email</button></div>
    </div>)}
    <p role="status" className="mt-3 text-sm">{busy ? "Checking delivery…" : message}</p>
  </section>;
}
