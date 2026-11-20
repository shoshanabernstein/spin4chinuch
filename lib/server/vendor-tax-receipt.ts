import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";

const REPLY_TO_EMAIL = "spinforchinuchyehudi@gmail.com";
const SENDER_NAME = "Spin for Chinuch Yehudi";
// Receipts send from info@ on the verified Resend domain (winner emails keep using WIN_EMAIL_FROM).
const SENDER_ADDRESS = "info@spinforchinuchyehudi.com";
const ORG_LINE = "Chinuch Yehudi USA Inc. · 135 Cables Ave, Waterbury, CT 06710 · info@chinuchyehudiusa.org";
const TAX_LINE = "Chinuch Yehudi USA Inc. is a U.S. tax-exempt 501(c)(3) organization (Tax ID # 99-4711564).";
const MISSION_LINE = "Your generosity directly supports our mission of giving Jewish children the opportunity to receive a quality Jewish education.";
const FINE_PRINT = "In accordance with IRS guidelines, Chinuch Yehudi USA Inc. does not assign a value to donated items. The donor is responsible for determining the fair market value of the donation for tax purposes. Please keep this receipt for your tax records.";

export type VendorReceipt = {
  /** Person the letter is addressed to ("Dear ..."). */
  donorName: string;
  /** Business the gift was given on behalf of; omitted when it is the person themselves. */
  businessName?: string | null;
  email: string;
  /** Date the donation was received, as YYYY-MM-DD. */
  receivedDate: string;
  /** What was donated, e.g. "three $50 Chocodela gift cards". */
  description: string;
};

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function validateVendorReceipt(input: unknown): VendorReceipt | string {
  if (!input || typeof input !== "object") return "Missing receipt details";
  const value = input as Record<string, unknown>;
  const text = (key: string, max: number) => (typeof value[key] === "string" ? (value[key] as string).trim().slice(0, max) : "");
  const receipt: VendorReceipt = {
    donorName: text("donorName", 120),
    businessName: text("businessName", 120) || null,
    email: text("email", 200),
    receivedDate: text("receivedDate", 10),
    description: text("description", 400),
  };
  if (!receipt.donorName) return "Enter the name for \"Dear ...\"";
  if (!EMAIL_PATTERN.test(receipt.email)) return "Enter a valid email address";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receipt.receivedDate) || Number.isNaN(Date.parse(`${receipt.receivedDate}T00:00:00Z`))) return "Enter the date the donation was received";
  if (!receipt.description) return "Describe what was donated";
  return receipt;
}

export function formatReceiptDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
}

function onBehalfOf(receipt: VendorReceipt) {
  const business = receipt.businessName?.trim();
  return business && business.toLowerCase() !== receipt.donorName.trim().toLowerCase() ? `, on behalf of ${business},` : "";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim();
}

export function receiptFileName(receipt: VendorReceipt) {
  const label = (receipt.businessName?.trim() || receipt.donorName.trim()).replace(/[^\p{L}\p{N} &'.-]/gu, "").trim();
  return `Donation Receipt - ${label || "Chinuch Yehudi"}.pdf`;
}

type Run = { text: string; font: PDFFont };

/** Lays out runs of text (each with its own font) as wrapped lines. */
function wrapRuns(runs: Run[], size: number, maxWidth: number) {
  const words: Run[] = [];
  for (const run of runs) {
    for (const piece of run.text.split(/(\s+)/)) if (piece) words.push({ text: piece, font: run.font });
  }
  const lines: Run[][] = [];
  let line: Run[] = [];
  let width = 0;
  for (const word of words) {
    const isSpace = /^\s+$/.test(word.text);
    const wordWidth = word.font.widthOfTextAtSize(isSpace ? " " : word.text, size);
    if (!isSpace && width + wordWidth > maxWidth && line.length) {
      while (line.length && /^\s+$/.test(line[line.length - 1].text)) line.pop();
      lines.push(line);
      line = [];
      width = 0;
    }
    if (isSpace && !line.length) continue;
    line.push(isSpace ? { text: " ", font: word.font } : word);
    width += wordWidth;
  }
  if (line.length) lines.push(line);
  return lines;
}

export async function buildVendorReceiptPdf(receipt: VendorReceipt) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Donation Receipt");
  pdf.setAuthor("Chinuch Yehudi USA Inc.");
  const page = pdf.addPage([612, 792]);
  const regular = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const ink = rgb(0.12, 0.16, 0.24);
  const muted = rgb(0.38, 0.42, 0.48);
  const margin = 72;
  const width = 612 - margin * 2;
  let y = 792 - margin;

  const paragraph = (runs: Run[], size = 12, color = ink, gapAfter = 14, lineHeight = size * 1.5) => {
    for (const line of wrapRuns(runs, size, width)) {
      y -= lineHeight;
      let x = margin;
      for (const run of line) {
        page.drawText(run.text, { x, y, size, font: run.font, color });
        x += run.font.widthOfTextAtSize(run.text, size);
      }
    }
    y -= gapAfter;
  };

  page.drawText("Thank you!", { x: margin, y: y - 30, size: 30, font: bold, color: ink });
  y -= 30 + 24;
  paragraph([{ text: `Dear ${receipt.donorName},`, font: regular }]);
  paragraph([{ text: `Thank you for your generous donation${onBehalfOf(receipt)} to Chinuch Yehudi USA Inc. for the Spin for Chinuch Yehudi campaign.`, font: regular }]);
  paragraph([
    { text: "On ", font: regular },
    { text: formatReceiptDate(receipt.receivedDate), font: bold },
    { text: ", we received your donation of ", font: regular },
    { text: receipt.description, font: bold },
    { text: ". No goods or services were provided to you in exchange for this gift.", font: regular },
  ]);
  paragraph([{ text: TAX_LINE, font: regular }]);
  paragraph([{ text: MISSION_LINE, font: regular }], 12, ink, 22);
  paragraph([{ text: "With gratitude,", font: regular }], 12, ink, 4);
  paragraph([{ text: "Chinuch Yehudi", font: bold }], 12, ink, 4);
  paragraph([{ text: ORG_LINE, font: regular }], 10, muted, 18);
  page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 0.5, color: rgb(0.83, 0.86, 0.89) });
  y -= 6;
  paragraph([{ text: FINE_PRINT, font: italic }], 8.5, muted, 0, 12);

  return pdf.save();
}

export function vendorReceiptEmail(receipt: VendorReceipt) {
  const name = firstName(receipt.donorName);
  return {
    subject: `Thank you, ${name}`,
    text: `Hi ${name},

Thank you so much for your generous donation to the Spin for Chinuch Yehudi campaign. Your support helps Jewish children around the country.

Attached is your tax receipt for your records.

With gratitude,
Chinuch Yehudi`,
  };
}

export async function sendVendorReceipt(receipt: VendorReceipt) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email sending is not configured");
  const pdf = await buildVendorReceiptPdf(receipt);
  const { subject, text } = vendorReceiptEmail(receipt);
  const { data, error } = await new Resend(apiKey).emails.send({
    from: `${SENDER_NAME} <${SENDER_ADDRESS}>`,
    to: receipt.email,
    replyTo: REPLY_TO_EMAIL,
    subject,
    text,
    attachments: [{ filename: receiptFileName(receipt), content: Buffer.from(pdf) }],
  });
  if (error || !data?.id) throw new Error(error?.message || "The email service did not confirm the receipt was sent");
  return data.id;
}
