import { supabaseAdmin } from "@/lib/server/supabase";
import { sendWinEmail } from "@/lib/server/win-email";

export const GIFT_CARD_BUCKET = "prize-gift-cards";
export const MAX_GIFT_CARD_BYTES = 3 * 1024 * 1024;
export function giftCardsEnabled() {
  return process.env.E_GIFT_CARDS_ENABLED === "true";
}

type ClaimedCard = {
  id: string;
  storage_path: string;
  recipient: string;
  prize_name: string;
  image_url: string | null;
  lease_token: string;
};

// Returns false only when this win has no assigned PDF. Errors must never fall
// back to the old email: a PDF may already have been accepted by Resend.
export async function deliverGiftCard(winId: number) {
  const existing = await supabaseAdmin.from("prize_gift_cards").select("id")
    .eq("win_id", winId).maybeSingle();
  if (existing.error) throw new Error("Unable to check the assigned gift card");
  if (!existing.data) return false;
  const { data, error } = await supabaseAdmin.rpc("claim_gift_card_email", { p_win_id: winId });
  if (error) throw new Error("Gift card email needs review or retry from Administration");
  if (!data) return true;
  const card = data as ClaimedCard;
  try {
    const download = await supabaseAdmin.storage.from(GIFT_CARD_BUCKET).download(card.storage_path);
    if (download.error || !download.data) throw new Error("Gift card PDF could not be loaded");
    const content = Buffer.from(await download.data.arrayBuffer());
    const emailId = await sendWinEmail(card.recipient, card.prize_name, card.image_url, { id: card.id, content });
    const finished = await supabaseAdmin.rpc("finish_gift_card_email", {
      p_win_id: winId, p_token: card.lease_token, p_email_id: emailId,
    });
    if (finished.error) throw new Error("Email accepted but fulfillment could not be recorded");
    return true;
  } catch {
    // Keep the reservation and stable idempotency key on every retry.
    await supabaseAdmin.from("prize_gift_cards").update({
      lease_until: null,
      last_error: "Delivery not confirmed. Retry within 23 hours; otherwise check Resend before manual fulfillment.",
    }).eq("id", card.id).eq("lease_token", card.lease_token).is("sent_at", null);
    throw new Error("Gift card email was not confirmed; the PDF remains reserved for this winner");
  }
}
