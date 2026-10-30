import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { isSupportedSpinAmount } from "@/lib/spin-pricing";

export const PURCHASE_EMAIL_SUBJECT = "Your Purchase is Confirmed";

const SITE_URL = "https://www.spinforchinuchyehudi.com";
const ASSETS = [
  "campaign-logo",
  "purchase-confirmed-orbit-navy",
  "purchase-spins-icon",
  "purchase-paid-icon",
  "purchase-education-navy",
  "purchase-orbit-trails",
] as const;

async function loadTemplate() {
  const directory = path.join(process.cwd(), "lib/server/email-templates/purchase-confirmation-v1");
  const [html, ...images] = await Promise.all([
    readFile(path.join(directory, "email.html"), "utf8"),
    ...ASSETS.map(name => readFile(path.join(directory, `${name}.png`))),
  ]);
  return {
    html: html as string,
    attachments: ASSETS.map((name, index) => ({
      filename: `${name}.png`,
      content: images[index] as Buffer,
      contentType: "image/png",
      contentId: name,
    })),
  };
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
  const from = process.env.WIN_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Purchase confirmation email is not configured");

  const fromAddress = (from.match(/<([^>]+)>/)?.[1] ?? from).trim();
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
    .format(purchase.amount / 100);
  template ??= loadTemplate();
  const { html, attachments } = await template;
  const { data, error } = await new Resend(apiKey).emails.send({
    from: `Spin for Chinuch <${fromAddress}>`,
    to: email,
    replyTo: "spinforchinuchyehudi@gmail.com",
    subject: PURCHASE_EMAIL_SUBJECT,
    html: html.replaceAll("{{spins}}", String(purchase.spins)).replaceAll("{{amount}}", amount),
    text: `You're ready to spin!\n\nSpins purchased: ${purchase.spins}\nTotal paid: ${amount}\n\nSpin the Wheel: ${SITE_URL}/spin\n\nEvery spin supports Jewish education. Thank you for supporting Chinuch Yehudi: https://chinuchyehudiusa.org/\n\nSpin for Chinuch - Presented by Chinuch Yehudi\nQuestions? Reply to this email or contact spinforchinuchyehudi@gmail.com.`,
    attachments,
  }, { idempotencyKey: `purchase-confirmation/${purchase.id}` });

  if (error || !data?.id) throw new Error("Purchase confirmation email was not accepted by the email service");
  return data.id;
}
