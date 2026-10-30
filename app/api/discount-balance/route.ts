import { NextResponse } from "next/server";
import { getRequestUser, supabaseAdmin } from "@/lib/server/supabase";

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin.rpc("discount_balance", { p_user_id: user.id });
  if (error?.code === "PGRST202") return NextResponse.json({ enabled: false, balanceCents: 0 });
  if (error || !data) return NextResponse.json({ error: "Unable to load discount balance" }, { status: 503 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
