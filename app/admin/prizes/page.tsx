"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Archive, Gift, PackageCheck, PackageX, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/ui/StatCard";

type Prize = {
  id: number;
  name: string;
  quantity: number;
  active: boolean;
  image_url: string | null;
  retail_value: number | null;
  sponsor_name: string | null;
};

type PrivateContact = {
  sponsor: string;
  contactName: string | null;
  contactEmail: string | null;
};

export default function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<PrivateContact[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadPrizes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("prizes").select("id,name,quantity,active,image_url,retail_value,sponsor_name").order("id");
    if (error) toast.error(`Unable to load prizes: ${error.message}`);
    setPrizes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void loadPrizes(); }, [loadPrizes]);

  useEffect(() => {
    async function loadContacts() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch("/api/admin/prize-contacts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setContacts(data.contacts ?? []);
    }
    void loadContacts();
  }, []);

  async function setPrizeActive(prize: Prize, active: boolean) {
    const verb = active ? "restore" : "archive";
    if (!window.confirm(`${verb[0].toUpperCase()}${verb.slice(1)} ${prize.name}?`)) return;
    const { error } = await supabase.from("prizes").update({ active }).eq("id", prize.id);
    if (error) return toast.error(error.message);
    toast.success(active ? "Prize restored." : "Prize archived.");
    await loadPrizes();
  }

  async function deletePrize(prize: Prize) {
    if (!window.confirm(`Permanently delete ${prize.name}, its wheel outcomes, and their spin-history entries? Existing winner names and prize records will remain, but their outcome link will be removed. This cannot be undone.`)) return;

    setDeletingId(prize.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session expired. Please log in again.");

      const response = await fetch("/api/admin/prizes", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prizeId: prize.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete prize.");

      const outcomeText = data.deletedOutcomes === 1
        ? " and 1 connected wheel outcome"
        : data.deletedOutcomes > 1
          ? ` and ${data.deletedOutcomes} connected wheel outcomes`
          : "";
      toast.success(`${prize.name}${outcomeText} permanently deleted.`);
      await loadPrizes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete prize.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className="page-hero">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4267A8]">Administration</p>
              <h1 className="mt-1 text-4xl font-black">Prizes</h1>
              <p className="mt-2 text-slate-500">Manage inventory and the prizes shown throughout the fundraiser.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin" className="rounded-full border border-slate-200 px-5 py-3 font-bold shadow-sm">Back to Admin</Link>
              <Link href="/admin/new-prize" className="flex items-center gap-2 rounded-full bg-[#2F6ED8] px-5 py-3 font-bold text-white shadow-lg"><Plus size={18} /> Add Prize</Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Total Prizes" value={prizes.length} icon={<Gift />} />
          <StatCard label="Active" value={prizes.filter((prize) => prize.active).length} icon={<PackageCheck />} />
          <StatCard label="Archived" value={prizes.filter((prize) => !prize.active).length} icon={<PackageX />} />
        </section>

        {loading ? (
          <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center text-slate-500 shadow-lg">Loading prizes…</div>
        ) : prizes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center text-slate-500">No prizes have been created.</div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {prizes.map((prize) => (
              <article key={prize.id} className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
                <div className="relative h-44 bg-gradient-to-br from-[#EEF4FF] to-[#FFF8DF]">
                  {prize.image_url ? <img src={prize.image_url} alt="" className="h-full w-full object-contain p-5" /> : <Gift className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-[#4267A8]/35" />}
                  <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${prize.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{prize.active ? "Active" : "Archived"}</span>
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-black">{prize.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">{prize.sponsor_name || "No sponsor listed"}</p>
                  {contacts.find((contact) => contact.sponsor === prize.sponsor_name) && (
                    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-600">
                      <p className="font-bold uppercase tracking-wide text-[#4267A8]">Private contact</p>
                      <p className="mt-1">{contacts.find((contact) => contact.sponsor === prize.sponsor_name)?.contactName || "No contact name"}</p>
                      <p className="break-all">{contacts.find((contact) => contact.sponsor === prize.sponsor_name)?.contactEmail || "No email provided"}</p>
                    </div>
                  )}
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-slate-400">Remaining</p><p className="text-xl font-black">{prize.quantity}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-slate-400">Value</p><p className="text-xl font-black">{prize.retail_value == null ? "—" : `$${prize.retail_value}`}</p></div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Link href={`/admin/edit/${prize.id}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2F6ED8] px-4 py-3 font-bold text-white"><Pencil size={17} /> Edit</Link>
                    <button onClick={() => void setPrizeActive(prize, !prize.active)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold ${prize.active ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{prize.active ? <Archive size={17} /> : <RotateCcw size={17} />}{prize.active ? "Archive" : "Restore"}</button>
                    <button
                      type="button"
                      disabled={deletingId === prize.id}
                      onClick={() => void deletePrize(prize)}
                      className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={17} />
                      {deletingId === prize.id ? "Deleting…" : "Delete Permanently"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
