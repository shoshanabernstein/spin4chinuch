import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server/supabase";

const LIMIT = 30;

// Public feed for the spin page. Uses the same public_winners view as the
// Winners page: initials and prize only, cancelled wins excluded.
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("public_winners")
    .select("id,prize,initials")
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (error) {
    return NextResponse.json({ error: "Winners are temporarily unavailable." }, { status: 503 });
  }

  const winners = (data ?? []).map((winner) => ({
    id: winner.id,
    initials: winner.initials || "Winner",
    prize: winner.prize ?? "Prize",
  }));

  return NextResponse.json({ winners }, { headers: { "Cache-Control": "no-store" } });
}
