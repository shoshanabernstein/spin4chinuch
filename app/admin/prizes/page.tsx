"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Archive, ArrowLeft, ArrowRight, GripVertical, Gift, PackageCheck, PackageX, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/ui/StatCard";
import PrizeCard from "@/components/buy-spins/PrizeCard";
import { movePrize, sortPrizes } from "@/lib/prize-order";

type Prize = {
  id: number;
  name: string;
  quantity: number;
  original_quantity: number;
  active: boolean;
  image_url: string | null;
  retail_value: number | null;
  sponsor_name: string | null;
};

type PrivateContact = {
  prizeId: number;
  contactName: string | null;
  contactEmail: string | null;
};

export default function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<PrivateContact[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropId, setDropId] = useState<number | null>(null);
  const [savedOrder, setSavedOrder] = useState<number[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderReady, setOrderReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const orderChanged = prizes.some((prize, index) => prize.id !== savedOrder[index]);

  const loadPrizes = useCallback(async () => {
    setLoading(true);
    setOrderReady(false);
    setLoadError("");
    try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Please sign in again.");
    const response = await fetch("/api/admin/prize-order", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load the saved prize order. Please reload.");
    const { order } = await response.json();
    const { data, error } = await supabase.from("prizes").select("*,wins!prize_id(count)").order("id");
    if (error) throw error;
    const ordered = sortPrizes((data ?? []).map((prize) => ({
      ...prize,
      original_quantity: prize.original_quantity ??
        prize.quantity + (prize.wins[0]?.count ?? 0),
    })), order);
    setPrizes(ordered);
    setSavedOrder(ordered.map((prize) => prize.id));
    setOrderReady(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load prizes.";
      setLoadError(message);
      toast.error(message);
    } finally {
    setLoading(false);
    }
  }, []);

  function reorder(from: number, to: number) {
    if (savingOrder || !orderReady) return;
    setPrizes((current) => movePrize(current, from, to));
  }

  async function saveOrder() {
    setSavingOrder(true);
    const order = prizes.map((prize) => prize.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const response = await fetch("/api/admin/prize-order", {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save order.");
      setSavedOrder(order);
      toast.success("Prize order saved for the public prize page.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save prize order.");
    } finally {
      setSavingOrder(false);
    }
  }

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
    void loadContacts().catch(() => toast.error("Private contacts could not be loaded. Please reload to try again."));
  }, []);

  async function setPrizeActive(prize: Prize, active: boolean) {
    if (savingOrder || orderChanged) return toast.error("Save or undo the prize order before changing prize status.");
    const verb = active ? "restore" : "archive";
    if (!window.confirm(`${verb[0].toUpperCase()}${verb.slice(1)} ${prize.name}?`)) return;
    const { error } = await supabase.from("prizes").update({ active }).eq("id", prize.id);
    if (error) return toast.error(error.message);
    toast.success(active ? "Prize restored." : "Prize archived.");
    await loadPrizes();
  }

  async function deletePrize(prize: Prize) {
    if (savingOrder || orderChanged) return toast.error("Save or undo the prize order before deleting a prize.");
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
          <StatCard label="Total Prizes" value={prizes.reduce((total, prize) => total + prize.original_quantity, 0)} icon={<Gift />} />
          <StatCard label="Active" value={prizes.filter((prize) => prize.active).length} icon={<PackageCheck />} />
          <StatCard label="Archived" value={prizes.filter((prize) => !prize.active).length} icon={<PackageX />} />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-white p-5">
          <p className="text-sm text-slate-600" aria-live="polite">{orderChanged ? "You have unsaved order changes." : "Drag a prize by its handle, or use the arrows to move it."}</p>
          <div className="flex gap-3">
            <button type="button" disabled={!orderChanged || savingOrder || loading} onClick={() => setPrizes((current) => sortPrizes(current, savedOrder))} className="rounded-full border px-5 py-2 font-bold disabled:opacity-40">Undo</button>
            <button type="button" disabled={!orderReady || !orderChanged || savingOrder || loading} onClick={() => void saveOrder()} className="rounded-full bg-[#2F6ED8] px-5 py-2 font-bold text-white disabled:opacity-40">{savingOrder ? "Saving..." : "Save Order"}</button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center text-slate-500 shadow-lg">Loading prizes…</div>
        ) : loadError ? (
          <div role="alert" className="rounded-3xl bg-white p-8 text-center text-red-600">
            <p>{loadError}</p>
            <button type="button" onClick={() => void loadPrizes()} className="mt-4 rounded-full bg-[#2F6ED8] px-5 py-2 font-bold text-white">Try again</button>
          </div>
        ) : prizes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center text-slate-500">No prizes have been created.</div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {prizes.map((prize, index) => (
              <div key={prize.id} onDragOver={(event) => { if (draggedId !== null && !savingOrder) { event.preventDefault(); setDropId(prize.id); } }} onDrop={(event) => { event.preventDefault(); if (draggedId !== null) reorder(draggedId, prize.id); setDraggedId(null); setDropId(null); }} className={`flex min-w-0 flex-col rounded-3xl ${dropId === prize.id ? "ring-4 ring-blue-400" : ""} ${draggedId === prize.id ? "opacity-50" : ""}`}>
                <div className="mb-2 flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2">
                  <button type="button" draggable={orderReady && !savingOrder} disabled={!orderReady || savingOrder} onDragStart={(event) => { setDraggedId(prize.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(prize.id)); }} onDragEnd={() => { setDraggedId(null); setDropId(null); }} aria-label={`Drag ${prize.name} to reorder`} className="flex cursor-grab items-center gap-2 rounded px-2 py-1 text-sm font-bold active:cursor-grabbing"><GripVertical size={18} />{index + 1}</button>
                  <div className="flex gap-1">
                    <button type="button" disabled={index === 0 || savingOrder || !orderReady} onClick={() => reorder(prize.id, prizes[index - 1].id)} aria-label={`Move ${prize.name} earlier`} className="rounded p-2 hover:bg-blue-100 disabled:opacity-30"><ArrowLeft size={18} /></button>
                    <button type="button" disabled={index === prizes.length - 1 || savingOrder || !orderReady} onClick={() => reorder(prize.id, prizes[index + 1].id)} aria-label={`Move ${prize.name} later`} className="rounded p-2 hover:bg-blue-100 disabled:opacity-30"><ArrowRight size={18} /></button>
                  </div>
                </div>
              <PrizeCard compact name={prize.name} imageUrl={prize.image_url} originalQuantity={prize.original_quantity} sponsorName={prize.sponsor_name}>
                <div className="border-t border-blue-100 p-3">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${prize.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{prize.active ? "Active" : "Archived"}</span>
                  {contacts.find((contact) => contact.prizeId === prize.id) && (
                    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-600">
                      <p className="font-bold uppercase tracking-wide text-[#4267A8]">Private contact</p>
                      <p className="mt-1">{contacts.find((contact) => contact.prizeId === prize.id)?.contactName || "No contact name"}</p>
                      <p className="break-all">{contacts.find((contact) => contact.prizeId === prize.id)?.contactEmail || "No email provided"}</p>
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 p-2"><p className="text-slate-400">Original Quantity</p><p className="text-lg font-black">{prize.original_quantity}</p></div>
                    <div className="rounded-xl bg-slate-50 p-2"><p className="text-slate-400">Value</p><p className="text-lg font-black">{prize.retail_value == null ? "—" : `$${prize.retail_value}`}</p></div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Link href={`/admin/edit/${prize.id}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2F6ED8] px-2 py-2 font-bold text-white"><Pencil size={17} /> Edit</Link>
                    <button onClick={() => void setPrizeActive(prize, !prize.active)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2 font-bold ${prize.active ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{prize.active ? <Archive size={17} /> : <RotateCcw size={17} />}{prize.active ? "Archive" : "Restore"}</button>
                    <button
                      type="button"
                      disabled={deletingId === prize.id}
                      onClick={() => void deletePrize(prize)}
                      className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-2 py-2 font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={17} />
                      {deletingId === prize.id ? "Deleting…" : "Delete Permanently"}
                    </button>
                  </div>
                </div>
              </PrizeCard>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
