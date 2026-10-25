import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/server/supabase";

// Both the webhook and the return page must make the same settlement decision.
export async function settlePayment(stripe: Stripe, payment: Stripe.PaymentIntent) {
  const spins = Number(payment.metadata.spins);
  if (!payment.metadata.userId || !Number.isInteger(spins) || spins < 1 || spins > 100 ||
      payment.status !== "succeeded" || payment.currency !== "usd" ||
      payment.amount_received !== spins * 1800) {
    throw new Error("Invalid payment details");
  }

  // Check durable Stripe state before crediting: idempotency keys expire, and
  // inventory could have changed since a previous refund attempt.
  const refunds = await stripe.refunds.list({ payment_intent: payment.id, limit: 100 });
  const previousRefund = refunds.data.find(refund => refund.metadata?.reason === "spin_limit_reached");
  if (previousRefund) return refundResult(previousRefund);

  const { error } = await supabaseAdmin.rpc("credit_completed_payment", {
    p_payment_intent_id: payment.id,
    p_user_id: payment.metadata.userId,
    p_spins: spins,
    p_amount: payment.amount_received,
  });
  if (!error) return { status: "succeeded" as const, spins };

  // Only this specific transactional rejection is safe to refund automatically.
  // Timeouts and other unknown failures must retry crediting instead.
  if (error.code !== "P0001" || !["The 1100 spin limit has been reached", "The 2000 spin limit has been reached"].includes(error.message)) {
    throw new Error(`Unable to credit payment: ${error.message}`);
  }
  const refund = await stripe.refunds.create({
    payment_intent: payment.id,
    amount: payment.amount_received,
    metadata: { reason: "spin_limit_reached" },
  }, { idempotencyKey: `spin-limit-refund/${payment.id}` });
  return refundResult(refund);
}

function refundResult(refund: Stripe.Refund) {
  if (refund.status !== "succeeded" && refund.status !== "pending") {
    throw new Error(`Sales-cap refund requires review: ${refund.id} (${refund.status})`);
  }
  return {
    status: refund.status === "succeeded" ? "refunded" as const : "refund_pending" as const,
    spins: 0,
  };
}
