import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";
import { deliverGiftCard, giftCardsEnabled } from "@/lib/server/gift-cards";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!giftCardsEnabled()) return NextResponse.json({ deliveries: [] });
  const { data, error } = await supabaseAdmin.from("prize_gift_cards")
    .select("id,win_id,prize_name,recipient,last_error,first_attempt_at,lease_until,wins!inner(status)")
    .eq("wins.status", "Pending").not("win_id", "is", null).is("sent_at", null).order("assigned_at");
  if (error) return NextResponse.json({ error: "Unable to load gift card deliveries." }, { status: 503 });
  return NextResponse.json({ deliveries: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!giftCardsEnabled()) return NextResponse.json({ error: "Gift card setup is not enabled." }, { status: 503 });
  try {
    const { winId } = await req.json();
    if (!Number.isSafeInteger(winId) || winId <= 0) return NextResponse.json({ error: "Invalid win" }, { status: 400 });
    if (!(await deliverGiftCard(winId))) return NextResponse.json({ error: "No gift card is assigned to this win." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Email was not confirmed. If the first attempt was over 23 hours ago, review the email in Resend and fulfill manually. The PDF remains reserved for this winner." }, { status: 503 });
  }
}
