import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  try {
    const form = await req.formData();
    const prizeId = Number(form.get("prizeId"));
    const file = form.get("file");
    if (!Number.isSafeInteger(prizeId) || prizeId < 1 || !(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "Choose a PNG or JPG logo up to 3 MB and a valid prize." }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!png && !jpg) return NextResponse.json({ error: "Only PNG and JPG images are supported." }, { status: 400 });
    const prize = await supabaseAdmin.from("prizes").select("id").eq("id", prizeId).maybeSingle();
    if (prize.error || !prize.data) return NextResponse.json({ error: "Prize could not be found." }, { status: 404 });
    const path = `${prizeId}/${randomUUID()}.${png ? "png" : "jpg"}`;
    const uploaded = await supabaseAdmin.storage.from("prize-logos").upload(path, bytes, { contentType: png ? "image/png" : "image/jpeg", upsert: false });
    if (uploaded.error) return NextResponse.json({ error: "Logo upload failed. Please try again." }, { status: 503 });
    const imageUrl = supabaseAdmin.storage.from("prize-logos").getPublicUrl(path).data.publicUrl;
    const saved = await supabaseAdmin.from("prizes").update({ image_url: imageUrl }).eq("id", prizeId).select("id").single();
    if (saved.error) return NextResponse.json({ error: "Logo save was not confirmed. Refresh the page before retrying." }, { status: 503 });
    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json({ error: "Logo upload was not confirmed. Refresh the page before retrying." }, { status: 503 });
  }
}
