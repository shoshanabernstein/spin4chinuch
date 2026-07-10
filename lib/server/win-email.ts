import { Resend } from "resend";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export async function sendWinEmail(email: string, prize: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WIN_EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("Win email skipped because Resend is not configured");
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: email,
    subject: "You won a Spin4Chinuch prize!",
    html: `<h1>Congratulations!</h1><p>You won:</p><h2>${escapeHtml(prize)}</h2><p>We will contact you with fulfillment details. Thank you for supporting Jewish education.</p>`,
  });
}
