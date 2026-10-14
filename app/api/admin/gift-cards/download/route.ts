import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";
import { GIFT_CARD_BUCKET, giftCardsEnabled } from "@/lib/server/gift-cards";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!giftCardsEnabled()) return NextResponse.json({ error: "Gift cards are not enabled." }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid gift card" }, { status: 400 });
  const card = await supabaseAdmin.from("prize_gift_cards").select("storage_path").eq("id", id).single();
  if (card.error) return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
  const file = await supabaseAdmin.storage.from(GIFT_CARD_BUCKET).download(card.data.storage_path);
  if (file.error) return NextResponse.json({ error: "PDF could not be downloaded" }, { status: 503 });
  return new Response(file.data, { headers: {
    "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="gift-card.pdf"',
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}
