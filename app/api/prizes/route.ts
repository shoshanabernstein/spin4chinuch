import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server/supabase";
import { readPrizeOrder } from "@/lib/server/prize-order";
import { sortPrizes } from "@/lib/prize-order";

export async function GET() {
  // Read stock and award counts in one database snapshot so a concurrent win
  // cannot temporarily change the displayed total. Only publish card fields.
  const { data, error } = await supabaseAdmin
    .from("prizes")
    .select("*,wins!prize_id(count)")
    .eq("active", true)
    .order("retail_value", { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json(
      { error: "Prizes are temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }

  const prizes = (data ?? []).map((prize) => ({
    id: prize.id,
    name: prize.name,
    image_url: prize.image_url,
    retail_value: prize.retail_value,
    quantity: prize.quantity,
    original_quantity: prize.original_quantity ??
      prize.quantity + (prize.wins[0]?.count ?? 0),
    sponsor_name: prize.sponsor_name,
  })).filter((prize) => prize.original_quantity > 0);

  try {
    const orderedPrizes = sortPrizes(prizes, await readPrizeOrder());
    return NextResponse.json({ prizes: orderedPrizes }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Prizes are temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
