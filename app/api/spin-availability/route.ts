import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server/supabase";
import { remainingSpinsForSale, TOTAL_SPIN_LIMIT } from "@/lib/spin-sales";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.rpc("sold_spin_count");
    if (error) throw error;
    return NextResponse.json(
      { remaining: remainingSpinsForSale(data), limit: TOTAL_SPIN_LIMIT },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Unable to check spin availability." }, { status: 503 });
  }
}
