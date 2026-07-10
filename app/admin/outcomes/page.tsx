"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Prize = { id: number; name: string };
type Outcome = {
  id: number;
  label: string;
  type: "prize" | "loss";
  prize_id: number | null;
  probability: number;
  active: boolean;
};

export default function OutcomesAdminPage() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"prize" | "loss">("loss");
  const [prizeId, setPrizeId] = useState("");
  const [probability, setProbability] = useState(1);

  async function load() {
    const [outcomeResult, prizeResult] = await Promise.all([
      supabase.from("wheel_outcomes").select("*").order("id"),
      supabase.from("prizes").select("id,name").eq("active", true).gt("quantity", 0).order("name"),
    ]);

    if (outcomeResult.error) window.alert(outcomeResult.error.message);
    if (prizeResult.error) window.alert(prizeResult.error.message);
    setOutcomes((outcomeResult.data as Outcome[] | null) ?? []);
    setPrizes((prizeResult.data as Prize[] | null) ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function createOutcome() {
    if (!label.trim() || !Number.isInteger(probability) || probability < 1) {
      window.alert("Enter a label and a positive whole-number weight.");
      return;
    }
    if (type === "prize" && !prizeId) {
      window.alert("Choose a prize for a prize outcome.");
      return;
    }

    const { error } = await supabase.from("wheel_outcomes").insert({
      label: label.trim(),
      type,
      prize_id: type === "prize" ? Number(prizeId) : null,
      probability,
      active: true,
    });
    if (error) return window.alert(error.message);

    setLabel("");
    setPrizeId("");
    setProbability(1);
    await load();
  }

  async function updateOutcome(id: number, patch: Partial<Outcome>) {
    const { error } = await supabase.from("wheel_outcomes").update(patch).eq("id", id);
    if (error) return window.alert(error.message);
    await load();
  }

  const totalWeight = outcomes
    .filter((item) => item.active)
    .reduce((sum, item) => sum + item.probability, 0);

  return (
    <div className="min-h-screen bg-[#F6F9FD] px-4 py-10 text-[#142A52] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.24em] text-[#4267A8]">Administration</p>
            <h1 className="mt-2 text-4xl font-black">Wheel outcomes</h1>
            <p className="mt-2 text-slate-500">Weights are relative. A weight of 2 is twice as likely as 1.</p>
          </div>
          <Link href="/admin" className="rounded-full border border-slate-200 bg-white px-5 py-3 font-bold">Back to admin</Link>
        </header>

        <section className="grid gap-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg md:grid-cols-5">
          <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Wheel label" className="rounded-xl border border-slate-300 px-4 py-3" />
          <select value={type} onChange={(event) => setType(event.target.value as "prize" | "loss")} className="rounded-xl border border-slate-300 px-4 py-3">
            <option value="loss">Non-winning</option>
            <option value="prize">Prize</option>
          </select>
          <select value={prizeId} disabled={type === "loss"} onChange={(event) => setPrizeId(event.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100">
            <option value="">Select prize</option>
            {prizes.map((prize) => <option key={prize.id} value={prize.id}>{prize.name}</option>)}
          </select>
          <input type="number" min={1} step={1} value={probability} onChange={(event) => setProbability(Number(event.target.value))} className="rounded-xl border border-slate-300 px-4 py-3" />
          <button onClick={createOutcome} className="rounded-xl bg-[#2F6ED8] px-5 py-3 font-bold text-white">Add outcome</button>
        </section>

        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
          {outcomes.map((outcome) => {
            const chance = totalWeight > 0 && outcome.active
              ? ((outcome.probability / totalWeight) * 100).toFixed(1)
              : "0.0";
            return (
              <div key={outcome.id} className="grid gap-4 border-b border-slate-100 p-5 last:border-0 md:grid-cols-[1fr_120px_140px_110px] md:items-center">
                <div>
                  <p className="font-bold">{outcome.label}</p>
                  <p className="text-sm text-slate-500">{outcome.type === "prize" ? "Prize outcome" : "Non-winning outcome"} · {chance}% current share</p>
                </div>
                <input type="number" min={1} step={1} value={outcome.probability} onChange={(event) => setOutcomes((current) => current.map((item) => item.id === outcome.id ? { ...item, probability: Number(event.target.value) } : item))} onBlur={() => void updateOutcome(outcome.id, { probability: outcome.probability })} className="rounded-xl border border-slate-300 px-3 py-2" />
                <button onClick={() => void updateOutcome(outcome.id, { active: !outcome.active })} className={`rounded-full px-4 py-2 text-sm font-bold ${outcome.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{outcome.active ? "Active" : "Inactive"}</button>
                <span className="text-right text-sm text-slate-400">ID {outcome.id}</span>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
