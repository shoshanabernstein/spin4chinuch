import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";
import { sendVendorReceipt, validateVendorReceipt } from "@/lib/server/vendor-tax-receipt";

// Emails one vendor their tax receipt (short thank-you note + PDF attachment) and
// records it so the Tax Receipts page can show it was sent.
// Only ever called from an explicit Send click on the admin Tax Receipts page.
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const body = await req.json().catch(() => null);
  const vendorKey = typeof body?.vendorKey === "string" ? body.vendorKey.trim().slice(0, 200) : "";
  if (!vendorKey) return NextResponse.json({ error: "Missing vendor" }, { status: 400 });
  const receipt = validateVendorReceipt(body);
  if (typeof receipt === "string") return NextResponse.json({ error: receipt }, { status: 400 });

  let id: string;
  try {
    id = await sendVendorReceipt(receipt);
  } catch (error) {
    console.error("Vendor tax receipt failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sending failed" }, { status: 502 });
  }

  const sentAt = new Date().toISOString();
  const { error: logError } = await supabaseAdmin.from("vendor_tax_receipts").insert({
    vendor_key: vendorKey,
    recipient_email: receipt.email,
    donor_name: receipt.donorName,
    business_name: receipt.businessName ?? null,
    received_date: receipt.receivedDate,
    description: receipt.description,
    sent_at: sentAt,
    sent_via: "website",
    email_id: id,
    sent_by: admin.user.id,
  });
  // The email already went out; a logging failure must not look like a send failure.
  if (logError) console.error("Could not record vendor tax receipt", logError);

  return NextResponse.json({ sent: true, id, sentAt, recorded: !logError });
}
