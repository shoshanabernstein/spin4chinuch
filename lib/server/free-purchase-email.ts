import { supabaseAdmin } from "@/lib/server/supabase";
import { sendPurchaseConfirmation } from "@/lib/server/purchase-email";

export async function deliverFreePurchaseEmail(id: string, userId: string, email: string) {
  const { data: quote, error } = await supabaseAdmin.rpc("free_discount_email", {
    p_id: id, p_user_id: userId, p_email: email,
  });
  if (error || !quote) throw new Error("Free purchase confirmation could not be loaded");
  if (quote.email_id) return;
  if (Date.now() - new Date(quote.email_started_at).getTime() >= 23 * 3600000) {
    throw new Error("Free purchase email requires manual review");
  }
  const receipt = await sendPurchaseConfirmation(quote.email_to, {
    id: quote.payment_id, spins: quote.spins, amount: 0,
    subtotal: quote.subtotal, discount: quote.discount,
  });
  const saved = await supabaseAdmin.rpc("free_discount_email", {
    p_id: id, p_user_id: userId, p_email: email, p_receipt: receipt,
  });
  if (saved.error) throw new Error("Free purchase email receipt could not be saved");
}
