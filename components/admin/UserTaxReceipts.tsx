"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheck, FileText, Send } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

type UserPrize = { name: string; valueCents: number | null };
type UserRow = {
  userId: string;
  donorName: string;
  email: string;
  period: string;
  purchases: number;
  spins: number;
  totalCents: number;
  prizes: UserPrize[];
  prizeValueCents: number;
  deductibleCents: number;
  lastSent: { email: string; sentAt: string } | null;
};

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in again.");
  return { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
}

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const formatSentDate = (timestamp: string) => new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function UserTaxReceipts() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { donorName: string; email: string }>>({});
  const [sent, setSent] = useState<Record<string, { email: string; sentAt: string }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulk, setBulk] = useState<{ done: number; total: number; failed: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/tax-receipts/users", { headers: await authHeaders(), cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load users");
      setUsers(data.users);
      setDrafts(Object.fromEntries((data.users as UserRow[]).map((user) => [user.userId, { donorName: user.donorName, email: user.email }])));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const lastSentFor = (user: UserRow) => sent[user.userId] ?? user.lastSent;
  const ready = (user: UserRow) => Boolean(drafts[user.userId]?.donorName.trim() && drafts[user.userId]?.email.trim());
  const setDraft = (userId: string, field: "donorName" | "email", value: string) =>
    setDrafts((current) => ({ ...current, [userId]: { ...current[userId], [field]: value } }));

  async function sendOne(userId: string) {
    const response = await fetch("/api/admin/tax-receipts/users/send", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ userId, ...drafts[userId] }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Sending failed");
    setSent((current) => ({ ...current, [userId]: { email: drafts[userId].email, sentAt: data.sentAt } }));
  }

  async function preview(userId: string) {
    const tab = window.open("", "_blank");
    setBusy(userId);
    try {
      const response = await fetch("/api/admin/tax-receipts/users/preview", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ userId, ...drafts[userId] }) });
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

  async function send(user: UserRow) {
    const draft = drafts[user.userId];
    const previous = lastSentFor(user);
    const warning = previous ? `\n\nA receipt was already sent to ${previous.email} on ${formatSentDate(previous.sentAt)}.` : "";
    if (!window.confirm(`Send the tax receipt to ${draft.donorName} at ${draft.email}?${warning}`)) return;
    setBusy(user.userId);
    try {
      await sendOne(user.userId);
      toast.success(`Receipt sent to ${draft.email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sending failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendAll() {
    const pending = users.filter((user) => !lastSentFor(user) && ready(user));
    const skipped = users.length - pending.length;
    if (!pending.length) {
      toast("Everyone with a name and email has already been sent a receipt.");
      return;
    }
    const skippedNote = `${skipped} user${skipped === 1 ? " is" : "s are"} skipped (already sent, or missing a name or email).`;
    if (!window.confirm(`Send tax receipts to ${pending.length} user${pending.length === 1 ? "" : "s"}?\n\nThey go out one at a time, a few seconds apart. ${skippedNote}`)) return;
    setBusy("all");
    setBulk({ done: 0, total: pending.length, failed: 0 });
    let failed = 0;
    for (const [index, user] of pending.entries()) {
      try {
        await sendOne(user.userId);
      } catch (error) {
        failed += 1;
        console.error(`Receipt for ${drafts[user.userId].email} failed`, error);
      }
      setBulk({ done: index + 1, total: pending.length, failed });
      if (index < pending.length - 1) await pause(3000);
    }
    setBusy(null);
    if (failed) toast.error(`${failed} receipt${failed === 1 ? "" : "s"} could not be sent. Those users still show "Not sent yet".`);
    else toast.success(`Sent ${pending.length} receipt${pending.length === 1 ? "" : "s"}.`);
  }

  if (loading) return <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center text-slate-500 shadow-lg">Loading users…</div>;
  if (users.length === 0) return <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center text-slate-500 shadow-lg">No purchases found.</div>;

  const field = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
  const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400";
  const unsent = users.filter((user) => !lastSentFor(user)).length;

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold">{users.length} purchasing users · {unsent} not sent yet</p>
          <p className="text-sm text-slate-500">Each receipt shows what they paid, minus the value of any prize they won. Amounts come from the purchase records and can&apos;t be edited here.</p>
          {bulk && <p className="mt-2 text-sm font-bold text-[#2F6ED8]">Sending {bulk.done} of {bulk.total}{bulk.failed ? ` · ${bulk.failed} failed` : ""}{bulk.done === bulk.total ? " · done" : "…"}</p>}
        </div>
        <button type="button" disabled={busy !== null || unsent === 0} onClick={() => void sendAll()} className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#2F6ED8] px-6 py-3 font-bold text-white shadow transition hover:bg-[#255bb5] disabled:opacity-50">
          <Send size={18} aria-hidden="true" /> Send to all not yet sent
        </button>
      </div>
      {users.map((user) => {
        const draft = drafts[user.userId];
        const last = lastSentFor(user);
        return (
          <article key={user.userId} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black">{user.donorName || user.email || "Unnamed user"}</h2>
                <p className="text-sm text-slate-500">{user.purchases} purchase{user.purchases === 1 ? "" : "s"} · {user.spins} spins · {user.period}</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-1 text-sm">
              <div className="flex justify-between gap-4"><dt>Total contributed</dt><dd className="tabular-nums">{money(user.totalCents)}</dd></div>
              {user.prizes.map((prize, index) => (
                <div key={index} className="flex justify-between gap-4 text-slate-600"><dt>Prize: {prize.name}</dt><dd className="tabular-nums">{prize.valueCents ? `−${money(prize.valueCents)}` : "no value listed"}</dd></div>
              ))}
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 font-bold"><dt>Tax-deductible amount</dt><dd className="tabular-nums">{money(user.deductibleCents)}</dd></div>
            </dl>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className={label} htmlFor={`uname-${user.userId}`}>Dear …</label><input id={`uname-${user.userId}`} className={field} value={draft.donorName} onChange={(event) => setDraft(user.userId, "donorName", event.target.value)} /></div>
              <div><label className={label} htmlFor={`uemail-${user.userId}`}>Email</label><input id={`uemail-${user.userId}`} type="email" className={field} value={draft.email} onChange={(event) => setDraft(user.userId, "email", event.target.value)} /></div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" disabled={busy !== null || !ready(user)} onClick={() => void preview(user.userId)} className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 font-bold shadow-sm transition hover:bg-slate-50 disabled:opacity-50">
                <FileText size={18} aria-hidden="true" /> Preview receipt
              </button>
              <button type="button" disabled={busy !== null || !ready(user)} onClick={() => void send(user)} className="flex items-center gap-2 rounded-full bg-[#2F6ED8] px-5 py-2.5 font-bold text-white shadow transition hover:bg-[#255bb5] disabled:opacity-50">
                <Send size={18} aria-hidden="true" /> {busy === user.userId ? "Working…" : "Send"}
              </button>
              {last ? (
                <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700"><CircleCheck size={16} aria-hidden="true" /> Sent {formatSentDate(last.sentAt)} to {last.email}</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">Not sent yet</span>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
