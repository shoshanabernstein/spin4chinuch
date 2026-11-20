import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";
import { loadUserReceipts, receiptPeriod, sendUserReceipt, validateUserOverrides, type UserReceipt } from "@/lib/server/user-tax-receipt";

// Emails one user their tax receipt and records it. Called once per user from the
// admin page (Send, or Send to all, which sends one at a time).
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const input = validateUserOverrides(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

  let receipt: UserReceipt | undefined;
  try {
    [receipt] = await loadUserReceipts(input.userId);
  } catch {
    return NextResponse.json({ error: "Unable to load this user's purchases" }, { status: 500 });
  }
  if (!receipt) return NextResponse.json({ error: "This user has no purchases" }, { status: 404 });
  receipt = { ...receipt, donorName: input.donorName, email: input.email };

  let id: string;
  try {
    id = await sendUserReceipt(receipt);
  } catch (error) {
    console.error("User tax receipt failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sending failed" }, { status: 502 });
  }

  const sentAt = new Date().toISOString();
  const { error: logError } = await supabaseAdmin.from("user_tax_receipts").insert({
    user_id: receipt.userId,
    recipient_email: receipt.email,
    donor_name: receipt.donorName,
    period: receiptPeriod(receipt),
    total_cents: receipt.totalCents,
    prize_value_cents: receipt.prizeValueCents,
    deductible_cents: receipt.deductibleCents,
    sent_at: sentAt,
    email_id: id,
    sent_by: admin.user.id,
  });
  // The email already went out; a logging failure must not look like a send failure.
  if (logError) console.error("Could not record user tax receipt", logError);

  return NextResponse.json({ sent: true, id, sentAt, recorded: !logError });
}
