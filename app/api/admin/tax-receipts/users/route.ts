import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";
import { loadUserReceipts, receiptPeriod } from "@/lib/server/user-tax-receipt";

// Lists every purchasing user with their contribution, prizes won and deductible amount.
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const [receipts, sentResult] = await Promise.all([
      loadUserReceipts(),
      supabaseAdmin.from("user_tax_receipts").select("user_id,recipient_email,sent_at").order("sent_at", { ascending: false }),
    ]);
    const lastSent = new Map<string, { email: string; sentAt: string }>();
    for (const row of sentResult.error ? [] : sentResult.data ?? []) {
      if (row.user_id && !lastSent.has(row.user_id)) lastSent.set(row.user_id, { email: row.recipient_email, sentAt: row.sent_at });
    }
    return NextResponse.json({
      users: receipts.map((receipt) => ({ ...receipt, period: receiptPeriod(receipt), lastSent: lastSent.get(receipt.userId) ?? null })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load user receipts", error);
    return NextResponse.json({ error: "Unable to load users" }, { status: 500 });
  }
}
