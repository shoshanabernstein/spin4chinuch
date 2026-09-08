import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { data, error } = await supabaseAdmin
    .from("prize_contacts")
    .select("prize_id,contact_name,contact_email");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    contacts: (data ?? []).map((contact) => ({
      prizeId: contact.prize_id,
      contactName: contact.contact_name,
      contactEmail: contact.contact_email,
    })),
  });
}
