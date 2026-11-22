import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { isSupportedSpinAmount } from "@/lib/spin-pricing";

export const PURCHASE_EMAIL_SUBJECT = "Thank you for your purchase";
// Receipts come from info@ (not prizes@) to look less like prize/lottery mail to spam filters.
export const PURCHASE_EMAIL_FROM = "Spin for Chinuch Yehudi <info@spinforchinuchyehudi.com>";

async function loadTemplate() {
  const directory = path.join(process.cwd(), "lib/server/email-templates/purchase-confirmation-v2");
  const [html, text] = await Promise.all([
    readFile(path.join(directory, "email.html"), "utf8"),
    readFile(path.join(directory, "email.txt"), "utf8"),
  ]);
  return { html, text };
}

let template: ReturnType<typeof loadTemplate> | undefined;

export async function sendPurchaseConfirmation(
  email: string,
  purchase: { id: string; spins: number; amount: number; subtotal?: number; discount?: number }
) {
  const validAmount = purchase.subtotal === undefined
    ? isSupportedSpinAmount(purchase.spins, purchase.amount)
    : isSupportedSpinAmount(purchase.spins, purchase.subtotal) && Number.isInteger(purchase.discount) &&
      purchase.discount! >= 0 && purchase.discount! <= purchase.subtotal && purchase.amount === purchase.subtotal - purchase.discount!;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
      (!purchase.id.startsWith("pi_") && !(purchase.id.startsWith("free_") && purchase.amount === 0 && purchase.subtotal !== undefined)) || !Number.isInteger(purchase.spins) ||
      purchase.spins < 1 || purchase.spins > 100 || !validAmount) {
    throw new Error("Invalid purchase email details");
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Purchase confirmation email is not configured");

  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
    .format(purchase.amount / 100);
  template ??= loadTemplate();
  const { html, text } = await template;
  const { data, error } = await new Resend(apiKey).emails.send({
    from: PURCHASE_EMAIL_FROM,
    to: email,
    replyTo: "spinforchinuchyehudi@gmail.com",
    subject: PURCHASE_EMAIL_SUBJECT,
    html: html.replaceAll("{{spins}}", String(purchase.spins)).replaceAll("{{amount}}", amount),
    text: text.replaceAll("{{spins}}", String(purchase.spins)).replaceAll("{{amount}}", amount),
  }, { idempotencyKey: `purchase-confirmation/${purchase.id}` });

  if (error || !data?.id) throw new Error("Purchase confirmation email was not accepted by the email service");
  return data.id;
}
