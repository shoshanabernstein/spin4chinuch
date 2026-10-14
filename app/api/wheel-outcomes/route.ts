import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server/supabase";

type WheelRow = {
  id: number;
  label: string;
  prize_id: number | null;
  type: string;
  prizes: { name: string; active: boolean; sponsor_name: string | null } | null;
};

export async function GET() {
  // Display all active prize slices, even after stock reaches zero.
  // perform_spin still enforces remaining inventory when choosing a winner.
  const { data, error } = await supabaseAdmin
    .from("wheel_outcomes")
    .select("id,label,prize_id,type,prizes!prize_id(name,active,sponsor_name)")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .overrideTypes<WheelRow[], { merge: false }>();

  if (error) {
    return NextResponse.json({ error: "The prize wheel could not be loaded." }, { status: 503 });
  }

  const outcomes = (data ?? [])
    .filter((outcome) =>
      (outcome.type === "loss" && outcome.prize_id === null) ||
      (outcome.type === "prize" && outcome.prizes?.active)
    )
    .map((outcome) => ({
      id: outcome.id,
      label: outcome.prizes?.name ?? outcome.label,
      prize_id: outcome.prize_id,
      sponsor_name: outcome.prizes?.sponsor_name ?? null,
    }));

  return NextResponse.json({ outcomes }, { headers: { "Cache-Control": "no-store" } });
}
