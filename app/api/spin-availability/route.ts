import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server/supabase";
import { remainingSpinsForSale } from "@/lib/spin-sales";
import { readSpinLimit } from "@/lib/server/spin-limit";

export async function GET() {
  try {
    const [{ data, error }, limit] = await Promise.all([supabaseAdmin.rpc("sold_spin_count"), readSpinLimit()]);
    if (error) throw error;
    return NextResponse.json(
      { remaining: remainingSpinsForSale(data, limit), limit },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Unable to check spin availability." }, { status: 503 });
  }
}
