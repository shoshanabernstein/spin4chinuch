import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { buildUserReceiptPdf, loadUserReceipts, validateUserOverrides } from "@/lib/server/user-tax-receipt";

// Returns a user's receipt PDF. Amounts always come from the database; only the
// greeting name and email can be overridden by the admin.
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const input = validateUserOverrides(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

  try {
    const [receipt] = await loadUserReceipts(input.userId);
    if (!receipt) return NextResponse.json({ error: "This user has no purchases" }, { status: 404 });
    const pdf = await buildUserReceiptPdf({ ...receipt, donorName: input.donorName, email: input.email });
    return new Response(Buffer.from(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=\"Donation Receipt.pdf\"", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("User receipt preview failed", error);
    return NextResponse.json({ error: "Could not create the receipt. Check for unusual characters in the name." }, { status: 400 });
  }
}
