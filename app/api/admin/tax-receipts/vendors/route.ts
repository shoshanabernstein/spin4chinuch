import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";

type PrizeRow = {
  id: number;
  name: string;
  sponsor_name: string | null;
  created_at: string;
  quantity: number | null;
  original_quantity: number | null;
};

type ContactRow = {
  prize_id: number;
  contact_name: string | null;
  contact_email: string | null;
  notification_email: string | null;
};

/** The calendar date (America/New_York) a prize was added, as YYYY-MM-DD. */
function easternDate(timestamp: string) {
  const zoned = /[zZ]|[+-]\d\d:?\d\d$/.test(timestamp) ? timestamp : `${timestamp}Z`;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(zoned));
}

// Lists prize donors (grouped by sponsor) with receipt details pre-filled from
// the prize page. The admin can edit everything before sending.
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const [prizesResult, contactsResult, sentResult] = await Promise.all([
    supabaseAdmin.from("prizes").select("id,name,sponsor_name,created_at,quantity,original_quantity").order("created_at"),
    supabaseAdmin.from("prize_contacts").select("prize_id,contact_name,contact_email,notification_email"),
    supabaseAdmin.from("vendor_tax_receipts").select("vendor_key,recipient_email,sent_at").order("sent_at", { ascending: false }),
  ]);
  if (prizesResult.error || contactsResult.error) {
    return NextResponse.json({ error: "Unable to load vendors" }, { status: 500 });
  }
  // Most recent receipt per vendor. If the log can't be read, show vendors without it.
  const lastSent = new Map<string, { email: string; sentAt: string }>();
  for (const row of sentResult.error ? [] : sentResult.data ?? []) {
    if (!lastSent.has(row.vendor_key)) lastSent.set(row.vendor_key, { email: row.recipient_email, sentAt: row.sent_at });
  }

  const contacts = new Map((contactsResult.data as ContactRow[]).map((contact) => [contact.prize_id, contact]));
  const groups = new Map<string, PrizeRow[]>();
  for (const prize of prizesResult.data as PrizeRow[]) {
    const key = (prize.sponsor_name?.trim() || prize.name.trim()).toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), prize]);
  }

  const vendors = [...groups.entries()].map(([vendorKey, prizes]) => {
    const prizeContacts = prizes.map((prize) => contacts.get(prize.id)).filter(Boolean) as ContactRow[];
    const contactName = prizeContacts.find((contact) => contact.contact_name?.trim())?.contact_name?.trim() ?? "";
    const email = prizeContacts.find((contact) => contact.contact_email?.trim())?.contact_email?.trim()
      ?? prizeContacts.find((contact) => contact.notification_email?.trim())?.notification_email?.trim()
      ?? "";
    const sponsorName = prizes.find((prize) => prize.sponsor_name?.trim())?.sponsor_name?.trim() ?? "";
    const latest = prizes.reduce((newest, prize) => (prize.created_at > newest.created_at ? prize : newest));
    const items = prizes.map((prize) => {
      const count = prize.original_quantity ?? prize.quantity ?? 1;
      return { id: prize.id, name: prize.name, quantity: count, addedOn: easternDate(prize.created_at) };
    });
    return {
      key: vendorKey,
      lastSent: lastSent.get(vendorKey) ?? null,
      sponsorName,
      contactName,
      email,
      receivedDate: easternDate(latest.created_at),
      description: items.map((item) => (item.quantity > 1 ? `${item.quantity} × ${item.name}` : item.name)).join(", "),
      prizes: items,
    };
  });

  vendors.sort((a, b) => (a.contactName || a.sponsorName).localeCompare(b.contactName || b.sponsorName));
  return NextResponse.json({ vendors }, { headers: { "Cache-Control": "no-store" } });
}
