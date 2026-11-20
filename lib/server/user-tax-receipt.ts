import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/server/supabase";
import {
  EMAIL_PATTERN,
  MISSION_LINE,
  ORG_LINE,
  REPLY_TO_EMAIL,
  Run,
  SENDER_ADDRESS,
  SENDER_NAME,
  TAX_LINE,
  firstName,
  wrapRuns,
} from "@/lib/server/vendor-tax-receipt";

export type UserReceiptPrize = { name: string; valueCents: number | null };

export type UserReceipt = {
  userId: string;
  donorName: string;
  email: string;
  firstPaymentAt: string;
  lastPaymentAt: string;
  purchases: number;
  spins: number;
  totalCents: number;
  prizes: UserReceiptPrize[];
  prizeValueCents: number;
  deductibleCents: number;
};

const PAGE = 1000;

async function readAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error("Unable to load receipt data");
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

function toCents(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const dollars = Number(value);
  return Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : null;
}

/** Every purchasing user's totals (payment_logs ledger, in cents) less the value of prizes they won. */
export async function loadUserReceipts(onlyUserId?: string): Promise<UserReceipt[]> {
  type Payment = { user_id: string | null; amount: number; spins: number; created_at: string };
  type Win = { user_id: string | null; prize: string; retail_value: unknown; prize_id: number | null; status: string };
  type Prize = { id: number; retail_value: unknown };
  type Profile = { id: string; email: string | null; first_name: string | null; last_name: string | null };

  const payments = await readAll<Payment>((from, to) => {
    let query = supabaseAdmin.from("payment_logs").select("user_id,amount,spins,created_at").order("created_at").range(from, to);
    if (onlyUserId) query = query.eq("user_id", onlyUserId);
    return query;
  });
  const byUser = new Map<string, Payment[]>();
  for (const payment of payments) {
    if (!payment.user_id || !(payment.amount > 0)) continue;
    byUser.set(payment.user_id, [...(byUser.get(payment.user_id) ?? []), payment]);
  }
  const userIds = [...byUser.keys()];
  if (!userIds.length) return [];

  const [wins, prizes, profiles] = await Promise.all([
    readAll<Win>((from, to) => supabaseAdmin.from("wins").select("user_id,prize,retail_value,prize_id,status").in("user_id", userIds).neq("status", "Cancelled").range(from, to)),
    readAll<Prize>((from, to) => supabaseAdmin.from("prizes").select("id,retail_value").range(from, to)),
    readAll<Profile>((from, to) => supabaseAdmin.from("profiles").select("id,email,first_name,last_name").in("id", userIds).range(from, to)),
  ]);
  const prizeValues = new Map(prizes.map((prize) => [prize.id, toCents(prize.retail_value)]));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const winsByUser = new Map<string, UserReceiptPrize[]>();
  for (const win of wins) {
    if (!win.user_id) continue;
    const valueCents = toCents(win.retail_value) ?? (win.prize_id ? prizeValues.get(win.prize_id) ?? null : null);
    winsByUser.set(win.user_id, [...(winsByUser.get(win.user_id) ?? []), { name: win.prize, valueCents }]);
  }

  return userIds.map((userId) => {
    const userPayments = byUser.get(userId)!;
    const profile = profileById.get(userId);
    const userPrizes = winsByUser.get(userId) ?? [];
    const totalCents = userPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const prizeValueCents = userPrizes.reduce((sum, prize) => sum + (prize.valueCents ?? 0), 0);
    return {
      userId,
      donorName: [profile?.first_name, profile?.last_name].filter((part) => part?.trim()).join(" ").trim(),
      email: profile?.email?.trim() ?? "",
      firstPaymentAt: userPayments[0].created_at,
      lastPaymentAt: userPayments[userPayments.length - 1].created_at,
      purchases: userPayments.length,
      spins: userPayments.reduce((sum, payment) => sum + (payment.spins ?? 0), 0),
      totalCents,
      prizes: userPrizes,
      prizeValueCents,
      deductibleCents: Math.max(0, totalCents - prizeValueCents),
    };
  }).sort((a, b) => (a.donorName || a.email).localeCompare(b.donorName || b.email));
}

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function utc(timestamp: string) {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(timestamp) ? timestamp : `${timestamp}Z`);
}

export function receiptPeriod(receipt: Pick<UserReceipt, "firstPaymentAt" | "lastPaymentAt">) {
  const format = (date: Date, withYear: boolean) => date.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });
  const first = utc(receipt.firstPaymentAt);
  const last = utc(receipt.lastPaymentAt);
  const a = format(first, true);
  const b = format(last, true);
  return a === b ? a : `${format(first, false)} – ${b}`;
}

export function validateUserOverrides(input: unknown): { userId: string; donorName: string; email: string } | string {
  if (!input || typeof input !== "object") return "Missing receipt details";
  const value = input as Record<string, unknown>;
  const userId = typeof value.userId === "string" ? value.userId.trim() : "";
  const donorName = typeof value.donorName === "string" ? value.donorName.trim().slice(0, 120) : "";
  const email = typeof value.email === "string" ? value.email.trim().slice(0, 200) : "";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return "Missing user";
  if (!donorName) return "Enter the name for \"Dear ...\"";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address";
  return { userId, donorName, email };
}

export async function buildUserReceiptPdf(receipt: UserReceipt) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Donation Receipt");
  pdf.setAuthor("Chinuch Yehudi USA Inc.");
  const page = pdf.addPage([612, 792]);
  const regular = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const ink = rgb(0.12, 0.16, 0.24);
  const muted = rgb(0.38, 0.42, 0.48);
  const rule = rgb(0.83, 0.86, 0.89);
  const margin = 72;
  const width = 612 - margin * 2;
  let y = 792 - margin;

  const paragraph = (runs: Run[], size = 12, color = ink, gapAfter = 14, lineHeight = size * 1.5, maxWidth = width) => {
    for (const line of wrapRuns(runs, size, maxWidth)) {
      y -= lineHeight;
      let x = margin;
      for (const run of line) {
        page.drawText(run.text, { x, y, size, font: run.font, color });
        x += run.font.widthOfTextAtSize(run.text, size);
      }
    }
    y -= gapAfter;
  };
  const row = (label: string, amount: string, font = regular, line = true) => {
    const amountWidth = font.widthOfTextAtSize(amount, 12);
    const labelLines = wrapRuns([{ text: label, font }], 12, width - amountWidth - 24);
    const top = y;
    labelLines.forEach((parts, index) => {
      let x = margin;
      for (const part of parts) {
        page.drawText(part.text, { x, y: top - 16 - index * 16, size: 12, font: part.font, color: ink });
        x += part.font.widthOfTextAtSize(part.text, 12);
      }
    });
    page.drawText(amount, { x: margin + width - amountWidth, y: top - 16, size: 12, font, color: ink });
    y = top - 16 * labelLines.length - 8;
    if (line) page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 0.5, color: rule });
  };

  page.drawText("Thank you!", { x: margin, y: y - 30, size: 30, font: bold, color: ink });
  y -= 30 + 24;
  paragraph([{ text: `Dear ${receipt.donorName},`, font: regular }]);
  paragraph([{ text: "Thank you for your generous support of Chinuch Yehudi USA Inc. through the Spin for Chinuch Yehudi campaign.", font: regular }], 12, ink, 10);

  row(`Total contributed (${receiptPeriod(receipt)})`, money(receipt.totalCents));
  for (const prize of receipt.prizes) {
    row(prize.valueCents ? `Less: value of prize received – ${prize.name}` : `Prize received – ${prize.name} (no value listed)`, prize.valueCents ? `-${money(prize.valueCents)}` : "-");
  }
  y -= 2;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 1.5, color: ink });
  row("Tax-deductible amount", money(receipt.deductibleCents), bold, false);
  y -= 16;

  paragraph([{ text: TAX_LINE, font: regular }]);
  paragraph([{ text: MISSION_LINE, font: regular }], 12, ink, 22);
  paragraph([{ text: "With gratitude,", font: regular }], 12, ink, 4);
  paragraph([{ text: "Chinuch Yehudi", font: bold }], 12, ink, 4);
  paragraph([{ text: ORG_LINE, font: regular }], 10, muted, 18);
  page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 0.5, color: rule });
  y -= 6;
  const finePrint = receipt.prizeValueCents > 0
    ? `In exchange for your contribution, you received the prize(s) listed above with an estimated fair market value of ${money(receipt.prizeValueCents)}. The amount of your contribution that is deductible for federal income tax purposes is limited to the excess of your contribution over this value. Please keep this receipt for your tax records.`
    : receipt.prizes.length
      ? "The prize(s) listed above had no value listed, so no amount was subtracted. Please keep this receipt for your tax records."
      : "No goods or services were provided in exchange for your contribution. Please keep this receipt for your tax records.";
  paragraph([{ text: finePrint, font: italic }], 8.5, muted, 0, 12);

  return pdf.save();
}

export async function sendUserReceipt(receipt: UserReceipt) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email sending is not configured");
  const pdf = await buildUserReceiptPdf(receipt);
  const name = firstName(receipt.donorName);
  const { data, error } = await new Resend(apiKey).emails.send({
    from: `${SENDER_NAME} <${SENDER_ADDRESS}>`,
    to: receipt.email,
    replyTo: REPLY_TO_EMAIL,
    subject: `Thank you, ${name}`,
    text: `Hi ${name},

Thank you so much for your generous support of the Spin for Chinuch Yehudi campaign. Your support helps Jewish children around the country.

Attached is your tax receipt for your records.

With gratitude,
Chinuch Yehudi`,
    attachments: [{ filename: "Donation Receipt - Chinuch Yehudi.pdf", content: Buffer.from(pdf) }],
  });
  if (error || !data?.id) throw new Error(error?.message || "The email service did not confirm the receipt was sent");
  return data.id;
}
