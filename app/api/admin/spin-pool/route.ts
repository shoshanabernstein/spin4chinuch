import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const { data, error } = await supabaseAdmin.rpc("fixed_pool_status");
  if (error?.code === "PGRST202") return NextResponse.json({ pool: null }, { headers: { "Cache-Control": "no-store" } });
  if (error) return NextResponse.json({ error: "Unable to load the spin pool." }, { status: 503 });
  return NextResponse.json({ pool: data }, { headers: { "Cache-Control": "no-store" } });
}

// Sets the campaign's total number of spins for sale (Try Again results absorb the change).
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const body = await req.json().catch(() => null);
  const total = Number(body?.total);
  if (!Number.isSafeInteger(total) || total < 0) {
    return NextResponse.json({ error: "Enter a whole number of 0 or more." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.rpc("admin_set_spin_total", { p_total: total });
  if (error) {
    const known = error.code === "P0001";
    if (!known) console.error("Spin total adjustment failed", error);
    return NextResponse.json({ error: known ? error.message : "Unable to change the total spins." }, { status: known ? 400 : 503 });
  }
  return NextResponse.json({ pool: data });
}
