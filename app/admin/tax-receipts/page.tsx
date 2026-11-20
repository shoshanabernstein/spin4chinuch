"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, FileText, Send, Store, Users } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

type VendorPrize = { id: number; name: string; quantity: number; addedOn: string };
type Vendor = {
  key: string;
  lastSent: { email: string; sentAt: string } | null;
  sponsorName: string;
  contactName: string;
  email: string;
  receivedDate: string;
  description: string;
  prizes: VendorPrize[];
};
type Draft = { donorName: string; businessName: string; email: string; receivedDate: string; description: string };

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in again.");
  return { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
}

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
}

function formatSentDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TaxReceiptsPage() {
  const [tab, setTab] = useState<"vendors" | "users">("vendors");

  return (
    <main className="app-page">
      <div className="app-container">
        <section className="page-hero">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4267A8]">Administration</p>
              <h1 className="mt-1 text-4xl font-black">Tax Receipts</h1>
              <p className="mt-2 text-slate-500">Send donation receipts to prize vendors and supporters.</p>
            </div>
            <Link href="/admin" className="rounded-full border border-slate-200 px-5 py-3 text-center font-bold shadow-sm">Back to Admin</Link>
          </div>
        </section>

        <div role="tablist" aria-label="Receipt type" className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {([["vendors", "Vendors", Store], ["users", "Users", Users]] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 font-bold transition ${tab === value ? "bg-[#2F6ED8] text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Icon size={18} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        {tab === "vendors" ? <VendorReceipts /> : (
          <section className="rounded-3xl border border-blue-100 bg-white p-10 text-center shadow-lg">
            <Users className="mx-auto h-10 w-10 text-[#4267A8]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black">User receipts</h2>
            <p className="mt-2 text-slate-500">Coming soon.</p>
          </section>
        )}
      </div>
    </main>
  );
}

function VendorReceipts() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState<Record<string, { email: string; sentAt: string }>>({});

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/tax-receipts/vendors", { headers: await authHeaders(), cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load vendors");
      setVendors(data.vendors);
      setDrafts(Object.fromEntries((data.vendors as Vendor[]).map((vendor) => [vendor.key, {
        donorName: vendor.contactName || vendor.sponsorName,
        // Dedications ("In memory of ...") are not businesses, so leave those blank.
        businessName: /^in (memory|honor|honour) of/i.test(vendor.sponsorName) || vendor.sponsorName === vendor.contactName ? "" : vendor.sponsorName,
        email: vendor.email,
        receivedDate: vendor.receivedDate,
        description: vendor.description,
      }])));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  function update(key: string, field: keyof Draft, value: string) {
    setDrafts((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));
  }

  async function preview(key: string) {
    const tab = window.open("", "_blank");
    setBusy(key);
    try {
      const response = await fetch("/api/admin/tax-receipts/vendors/preview", { method: "POST", headers: await authHeaders(), body: JSON.stringify(drafts[key]) });
      if (!response.ok) throw new Error((await response.json()).error || "Preview failed");
      const url = URL.createObjectURL(await response.blob());
      if (tab) tab.location.href = url; else window.open(url, "_blank");
    } catch (error) {
      tab?.close();
      toast.error(error instanceof Error ? error.message : "Preview failed");
    } finally {
      setBusy(null);
    }
  }

  async function send(key: string) {
    const draft = drafts[key];
    const previous = sent[key] ?? vendors.find((vendor) => vendor.key === key)?.lastSent;
    const warning = previous ? `

A receipt was already sent to ${previous.email} on ${formatSentDate(previous.sentAt)}.` : "";
    if (!window.confirm(`Send the tax receipt to ${draft.donorName} at ${draft.email}?${warning}`)) return;
    setBusy(key);
    try {
      const response = await fetch("/api/admin/tax-receipts/vendors/send", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ ...draft, vendorKey: key }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sending failed");
      setSent((current) => ({ ...current, [key]: { email: draft.email, sentAt: data.sentAt } }));
      toast.success(`Receipt sent to ${draft.email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sending failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center text-slate-500 shadow-lg">Loading vendors…</div>;
  if (vendors.length === 0) return <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center text-slate-500 shadow-lg">No prize vendors found.</div>;

  const field = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
  const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400";

  return (
    <section className="grid gap-5">
      <p className="text-sm text-slate-500">Each receipt is filled in from the prize page, and you can edit anything before sending. Nothing is sent until you press <b>Send</b>. Emails come from Spin for Chinuch Yehudi (info@spinforchinuchyehudi.com), and replies go to spinforchinuchyehudi@gmail.com.</p>
      {vendors.map((vendor) => {
        const draft = drafts[vendor.key];
        return (
          <article key={vendor.key} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black">{vendor.contactName || vendor.sponsorName}</h2>
                {vendor.sponsorName && vendor.contactName && <p className="text-sm text-slate-500">{vendor.sponsorName}</p>}
              </div>
              {(() => {
                const last = sent[vendor.key] ?? vendor.lastSent;
                return last ? (
                  <span className="flex items-center gap-1.5 self-start rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    <CircleCheck size={16} aria-hidden="true" /> Sent {formatSentDate(last.sentAt)} to {last.email}
                  </span>
                ) : (
                  <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">Not sent yet</span>
                );
              })()}
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {vendor.prizes.map((prize) => (
                <li key={prize.id}>{prize.quantity > 1 ? `${prize.quantity} × ` : ""}{prize.name} <span className="text-slate-400">· added {formatDate(prize.addedOn)}</span></li>
              ))}
            </ul>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className={label} htmlFor={`name-${vendor.key}`}>Dear …</label><input id={`name-${vendor.key}`} className={field} value={draft.donorName} onChange={(event) => update(vendor.key, "donorName", event.target.value)} /></div>
              <div><label className={label} htmlFor={`business-${vendor.key}`}>On behalf of (business)</label><input id={`business-${vendor.key}`} className={field} value={draft.businessName} placeholder="Leave blank if none" onChange={(event) => update(vendor.key, "businessName", event.target.value)} /></div>
              <div><label className={label} htmlFor={`email-${vendor.key}`}>Email</label><input id={`email-${vendor.key}`} type="email" className={field} value={draft.email} onChange={(event) => update(vendor.key, "email", event.target.value)} /></div>
              <div><label className={label} htmlFor={`date-${vendor.key}`}>Date received</label><input id={`date-${vendor.key}`} type="date" className={field} value={draft.receivedDate} onChange={(event) => update(vendor.key, "receivedDate", event.target.value)} /></div>
              <div className="sm:col-span-2"><label className={label} htmlFor={`items-${vendor.key}`}>What was donated</label><textarea id={`items-${vendor.key}`} rows={2} className={field} value={draft.description} onChange={(event) => update(vendor.key, "description", event.target.value)} /></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" disabled={busy !== null} onClick={() => void preview(vendor.key)} className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 font-bold shadow-sm transition hover:bg-slate-50 disabled:opacity-50">
                <FileText size={18} aria-hidden="true" /> Preview receipt
              </button>
              <button type="button" disabled={busy !== null || !draft.email} onClick={() => void send(vendor.key)} className="flex items-center gap-2 rounded-full bg-[#2F6ED8] px-5 py-2.5 font-bold text-white shadow transition hover:bg-[#255bb5] disabled:opacity-50">
                <Send size={18} aria-hidden="true" /> {busy === vendor.key ? "Working…" : "Send"}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
