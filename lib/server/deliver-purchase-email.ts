import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/server/supabase";
import { sendPurchaseConfirmation } from "@/lib/server/purchase-email";
import { isValidSpinPayment } from "@/lib/spin-pricing";

// Resend retains idempotency keys for 24 hours. Stop uncertain retries earlier;
// a later operator replay must not risk sending an already accepted email twice.
const SAFE_RETRY_SECONDS = 23 * 60 * 60;

export async function deliverPurchaseEmail(stripe: Stripe, paymentId: string) {
  // Event snapshots are stale on redelivery. Always inspect the durable receipt.
  let payment = await stripe.paymentIntents.retrieve(paymentId);
  if (payment.metadata.purchase_confirmation_email_id) {
    return payment.metadata.purchase_confirmation_email_id;
  }

  const spins = Number(payment.metadata.spins);
  if (!payment.metadata.userId || payment.status !== "succeeded" || payment.currency !== "usd" ||
      !Number.isInteger(spins) || spins < 1 || spins > 100 || !isValidSpinPayment(payment.metadata, payment.amount_received)) {
    throw new Error("Invalid completed purchase for confirmation email");
  }

  // A recorded purchase distinguishes a credited payment from a replay of an
  // archived/reset purchase, for which the credit RPC can also return false.
  const { data: recorded, error } = await supabaseAdmin.from("payment_logs")
    .select("user_id,spins,amount").eq("payment_intent_id", payment.id).maybeSingle();
  if (error || !recorded || recorded.user_id !== payment.metadata.userId ||
      recorded.spins !== spins || recorded.amount !== payment.amount_received) {
    throw new Error("Credited purchase could not be verified for confirmation email");
  }

  if (!payment.metadata.purchase_confirmation_started_at) {
    const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(payment.metadata.userId);
    if (userError || !data.user?.email) throw new Error("Purchase confirmation recipient could not be found");

    // Freeze the recipient before contacting Resend, keeping retry payloads stable
    // even if the account email changes. Concurrent initializers share a Stripe
    // idempotency key; a conflicting initializer fails and retries from this state.
    payment = await stripe.paymentIntents.update(payment.id, {
      metadata: {
        purchase_confirmation_started_at: String(Math.floor(Date.now() / 1000)),
        purchase_confirmation_to: data.user.email,
        purchase_confirmation_version: "1",
      },
    }, { idempotencyKey: `purchase-confirmation-start/${payment.id}` });
  }

  const started = Number(payment.metadata.purchase_confirmation_started_at);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(started) || started <= 0 || started > now + 60 ||
      now - started >= SAFE_RETRY_SECONDS || payment.metadata.purchase_confirmation_version !== "1") {
    throw new Error("Purchase email requires manual review in Resend before retrying");
  }
  const recipient = payment.metadata.purchase_confirmation_to;
  if (!recipient) throw new Error("Purchase confirmation recipient was not saved");

  const emailId = await sendPurchaseConfirmation(recipient, {
    id: payment.id, spins, amount: payment.amount_received,
  });
  // If saving the receipt fails, Stripe retries the webhook; Resend's stable key
  // returns the existing receipt within the safe window instead of sending again.
  await stripe.paymentIntents.update(payment.id, {
    metadata: { purchase_confirmation_email_id: emailId },
  });
  return emailId;
}
