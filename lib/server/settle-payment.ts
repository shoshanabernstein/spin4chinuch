import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/server/supabase";
import { isValidSpinPayment } from "@/lib/spin-pricing";

// Both the webhook and the return page must make the same settlement decision.
export async function settlePayment(stripe: Stripe, payment: Stripe.PaymentIntent) {
  const spins = Number(payment.metadata.spins);
  if (!payment.metadata.userId || !Number.isInteger(spins) || spins < 1 || spins > 100 ||
      payment.status !== "succeeded" || payment.currency !== "usd" ||
      !isValidSpinPayment(payment.metadata, payment.amount_received)) {
    throw new Error("Invalid payment details");
  }

  // Check durable Stripe state before crediting: idempotency keys expire, and
  // inventory could have changed since a previous refund attempt.
  const refunds = await stripe.refunds.list({ payment_intent: payment.id, limit: 100 });
  const previousRefund = refunds.data.find(refund => ["spin_limit_reached", "discount_balance_changed"].includes(refund.metadata?.reason ?? ""));
  if (previousRefund) return refundResult(previousRefund);

  const discounted = payment.metadata.pricingVersion === "discounts-v1";
  if (discounted) {
    const { data: quote, error: quoteError } = await supabaseAdmin.rpc("get_discount_quote", {
      p_id: payment.metadata.checkoutQuoteId, p_user_id: payment.metadata.userId,
    });
    if (quoteError || !quote || quote.spins !== spins || quote.amount !== payment.amount_received ||
        quote.subtotal !== Number(payment.metadata.subtotalCents) || quote.discount !== Number(payment.metadata.discountCents) ||
        quote.package_id !== payment.metadata.packageId) throw new Error("Invalid stored discount quote");
  }
  const { error } = discounted ? await supabaseAdmin.rpc("complete_discount_checkout", {
    p_id: payment.metadata.checkoutQuoteId, p_user_id: payment.metadata.userId,
    p_payment_id: payment.id, p_amount: payment.amount_received,
  }) : await supabaseAdmin.rpc("credit_completed_payment", {
    p_payment_intent_id: payment.id,
    p_user_id: payment.metadata.userId,
    p_spins: spins,
    p_amount: payment.amount_received,
  });
  if (!error) return { status: "succeeded" as const, spins };

  // Only this specific transactional rejection is safe to refund automatically.
  // Timeouts and other unknown failures must retry crediting instead.
  if (error.code !== "P0001" || !["The 1100 spin limit has been reached", "The 2000 spin limit has been reached", "Discount balance changed"].includes(error.message)) {
    throw new Error(`Unable to credit payment: ${error.message}`);
  }
  const refund = await stripe.refunds.create({
    payment_intent: payment.id,
    amount: payment.amount_received,
    metadata: { reason: error.message === "Discount balance changed" ? "discount_balance_changed" : "spin_limit_reached" },
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
    ...(refund.metadata?.reason === "discount_balance_changed" ? { reason: "discount_balance_changed" } : {}),
  };
}
