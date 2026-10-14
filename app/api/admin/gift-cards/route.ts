import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";
import { GIFT_CARD_BUCKET, giftCardsEnabled, MAX_GIFT_CARD_BYTES } from "@/lib/server/gift-cards";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!giftCardsEnabled()) return NextResponse.json({ enabled: false, cards: [] });
  const url = new URL(req.url);
  const prizeId = Number(url.searchParams.get("prizeId"));
  if (!Number.isSafeInteger(prizeId) || prizeId <= 0) return NextResponse.json({ error: "Invalid prize" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("prize_gift_cards")
    .select("id,filename,win_id,sent_at,last_error").eq("prize_id", prizeId).order("created_at");
  if (error) return NextResponse.json({ error: "Gift card database setup is incomplete or unavailable." }, { status: 503 });
  return NextResponse.json({ enabled: true, cards: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!giftCardsEnabled()) return NextResponse.json({ error: "Gift card setup has not been enabled." }, { status: 503 });
  try {
    const form = await req.formData();
    const prizeId = Number(form.get("prizeId"));
    const file = form.get("file");
    if (!Number.isSafeInteger(prizeId) || prizeId <= 0 || !(file instanceof File)) {
      return NextResponse.json({ error: "Select a prize and a PDF." }, { status: 400 });
    }
    if (file.size > MAX_GIFT_CARD_BYTES || file.size < 5 || !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Each gift card must be a PDF up to 3 MB." }, { status: 400 });
    }
    const content = Buffer.from(await file.arrayBuffer());
    if (content.subarray(0, 5).toString() !== "%PDF-") {
      return NextResponse.json({ error: "This file is not a PDF." }, { status: 400 });
    }
    const hash = createHash("sha256").update(content).digest("hex");
    const existing = await supabaseAdmin.from("prize_gift_cards").select("id").eq("sha256", hash).maybeSingle();
    if (existing.error) return NextResponse.json({ error: "Gift card database is unavailable." }, { status: 503 });
    if (existing.data) return NextResponse.json({ error: "This exact PDF has already been uploaded. Use a different gift card for each winner." }, { status: 409 });
    const prize = await supabaseAdmin.from("prizes").select("id").eq("id", prizeId).single();
    if (prize.error) return NextResponse.json({ error: "Prize not found." }, { status: 404 });
    const id = randomUUID();
    const path = `${prizeId}/${id}.pdf`;
    const upload = await supabaseAdmin.storage.from(GIFT_CARD_BUCKET).upload(path, content, { contentType: "application/pdf", upsert: false });
    if (upload.error) return NextResponse.json({ error: "PDF could not be uploaded. Please retry." }, { status: 503 });
    const saved = await supabaseAdmin.from("prize_gift_cards").insert({
      id, prize_id: prizeId, storage_path: path, sha256: hash,
      filename: file.name.replace(/[\r\n/\\]/g, "_").slice(0, 180),
    });
    if (saved.error) {
      // Only clean up on a definitive constraint rejection, never on an uncertain
      // network response where the reservation may already exist.
      if (["23505", "23503"].includes(saved.error.code)) {
        await supabaseAdmin.storage.from(GIFT_CARD_BUCKET).remove([path]);
      }
      return NextResponse.json({ error: saved.error.code === "23505" ? "This PDF has already been uploaded." : "PDF registration was not confirmed. Refresh the list before retrying." }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Upload was not confirmed. Refresh the list before retrying." }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!giftCardsEnabled()) return NextResponse.json({ error: "Gift card setup is not enabled." }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid gift card" }, { status: 400 });
  // This condition is checked under the row lock, including during concurrent spins.
  const { data, error } = await supabaseAdmin.from("prize_gift_cards").delete()
    .eq("id", id).is("win_id", null).select("storage_path").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Only unused gift cards can be removed. Refresh the list." }, { status: 409 });
  await supabaseAdmin.storage.from(GIFT_CARD_BUCKET).remove([data.storage_path]);
  return NextResponse.json({ success: true });
}
