import { Resend } from "resend";

const REPLY_TO_EMAIL = "spinforchinuchyehudi@gmail.com";
const DEFAULT_SITE_URL = "https://spinforchinuchyehudi.com";
const ASSET_BASE_URL = "https://spin4chinuch.vercel.app";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function getPublicImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl, ASSET_BASE_URL);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function winnerEmailHtml(prize: string, prizeImageUrl?: string | null) {
  const safePrize = escapeHtml(prize);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  const publicPrizeImageUrl = getPublicImageUrl(prizeImageUrl);
  const prizeVisual = publicPrizeImageUrl
    ? `<div style="margin:0 auto 16px;padding:12px;border:1px solid #d9e3ef;border-radius:16px;background:#ffffff;">
         <img src="${escapeHtml(publicPrizeImageUrl)}" width="220" alt="${safePrize}" style="display:block;width:220px;max-width:100%;max-height:120px;object-fit:contain;margin:0 auto;" />
       </div>`
    : `<div style="margin:0 auto 12px;width:48px;height:48px;border-radius:50%;background:#142a52;color:#f0d47f;font-size:25px;line-height:48px;">★</div>`;

  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;background:#eef3fa;font-family:Arial,Helvetica,sans-serif;color:#142a52;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          Congratulations—you won ${safePrize}!
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3fa;padding:34px 14px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;overflow:hidden;border:1px solid #d5e0ee;border-radius:26px;background:#ffffff;box-shadow:0 20px 55px rgba(20,42,82,.13);">
                <tr>
                  <td style="background:#0c1f38;padding:28px 36px 34px;text-align:center;border-bottom:5px solid #d8b34f;">
                    <div style="display:inline-block;border:1px solid rgba(240,212,127,.38);border-radius:999px;background:rgba(216,179,79,.13);padding:8px 15px;font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#f0d47f;">Spin for Chinuch</div>
                    <h1 style="margin:18px 0 0;font-size:40px;line-height:1.12;color:#ffffff;">You&apos;re a winner!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 38px 34px;">
                    <p style="margin:0;text-align:center;font-size:13px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:#6682a7;">You won</p>
                    <div style="margin:14px 0 28px;padding:26px 22px;border:1px solid #c9dcf4;border-radius:20px;background:#eef5ff;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.65);">
                      ${prizeVisual}
                      <p style="margin:0;font-size:26px;line-height:1.3;font-weight:800;color:#142a52;">${safePrize}</p>
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:16px;background:#fffaf0;border-left:4px solid #d8b34f;">
                      <tr>
                        <td style="padding:20px 22px;">
                          <p style="margin:0 0 6px;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:#9b7422;">What happens next?</p>
                          <p style="margin:0;font-size:17px;line-height:1.65;color:#344a64;">We will be in touch with you shortly regarding the delivery of your prize.</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:25px 0 0;text-align:center;font-size:16px;line-height:1.7;color:#53677f;">Thank you for participating and for supporting Jewish education.</p>

                    <div style="margin-top:28px;text-align:center;">
                      <a href="${siteUrl}/spin" style="display:inline-block;border-radius:999px;background:#142a52;padding:14px 28px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">Spin again</a>
                    </div>

                    <div style="margin-top:30px;border-top:1px solid #e4eaf1;padding-top:22px;text-align:center;">
                      <p style="margin:0;font-size:13px;line-height:1.6;color:#7b8da3;">
                        Questions? Reply to this email or contact
                        <a href="mailto:${REPLY_TO_EMAIL}" style="color:#2f6ed8;text-decoration:none;">${REPLY_TO_EMAIL}</a>.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendWinEmail(email: string, prize: string, prizeImageUrl?: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WIN_EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Winner email is not configured");
  }

  const fromAddress = from.match(/<([^>]+)>/)?.[1] ?? from;
  const sender = `Spin for Chinuch <${fromAddress.trim()}>`;
  const subjectPrize = prize.replace(/[\r\n]+/g, " ").trim();
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: sender,
    to: email,
    replyTo: REPLY_TO_EMAIL,
    subject: `You won ${subjectPrize}!`,
    text: `Congratulations! You won ${prize}. We will be in touch with you shortly regarding the delivery of your prize. Thank you for participating and for supporting Jewish education.`,
    html: winnerEmailHtml(prize, prizeImageUrl),
  });

  if (error) {
    throw new Error(`Resend could not send the winner email: ${error.message}`);
  }

  return data?.id;
}
