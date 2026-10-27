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
