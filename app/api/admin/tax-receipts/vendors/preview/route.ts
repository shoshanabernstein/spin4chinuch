import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { buildVendorReceiptPdf, receiptFileName, validateVendorReceipt } from "@/lib/server/vendor-tax-receipt";

// Returns the receipt PDF for the given details so the admin can check it before sending.
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const receipt = validateVendorReceipt(await req.json().catch(() => null));
  if (typeof receipt === "string") return NextResponse.json({ error: receipt }, { status: 400 });

  try {
    const pdf = await buildVendorReceiptPdf(receipt);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${receiptFileName(receipt).replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Receipt preview failed", error);
    return NextResponse.json({ error: "Could not create the receipt. Check for unusual characters in the details." }, { status: 400 });
  }
}
