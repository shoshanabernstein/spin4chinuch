import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";
import { PRIZE_ORDER_BUCKET, PRIZE_ORDER_FILE, readPrizeOrder } from "@/lib/server/prize-order";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  try {
    return NextResponse.json({ order: await readPrizeOrder() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load prize order." }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  let order: unknown;
  try { order = (await req.json()).order; } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!Array.isArray(order) || order.length > 1000 || !order.every((id) => Number.isSafeInteger(id) && id > 0) || new Set(order).size !== order.length) {
    return NextResponse.json({ error: "Invalid prize order." }, { status: 400 });
  }
  const { data, error, count } = await supabaseAdmin.from("prizes").select("id", { count: "exact" });
  if (error) return NextResponse.json({ error: "Unable to check prizes." }, { status: 503 });
  if (count !== order.length || !data?.every((prize) => order.includes(prize.id))) {
    return NextResponse.json({ error: "The prize list changed. Reload the page before reordering." }, { status: 409 });
  }
  const result = await supabaseAdmin.storage.from(PRIZE_ORDER_BUCKET).upload(PRIZE_ORDER_FILE, JSON.stringify(order), {
    contentType: "application/json", upsert: true, cacheControl: "0",
  });
  if (result.error) return NextResponse.json({ error: "Unable to save prize order. Please try again." }, { status: 503 });
  return NextResponse.json({ success: true });
}
