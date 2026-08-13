import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { privatePrizeContacts } from "@/lib/server/prize-contacts";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  return NextResponse.json({ contacts: privatePrizeContacts });
}
