import { NextResponse } from "next/server";
import Stripe from "stripe";
import { settlePayment } from "@/lib/server/settle-payment";
import { deliverPurchaseEmail } from "@/lib/server/deliver-purchase-email";
import { isValidSpinPayment } from "@/lib/spin-pricing";

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!secretKey || !webhookSecret) {
  throw new Error("Missing Stripe server environment variables");
}

const stripe = new Stripe(secretKey);
const verifiedWebhookSecret = webhookSecret;

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing Stripe signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, verifiedWebhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature validation failed", error);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const userId = paymentIntent.metadata.userId;
  const spins = Number(paymentIntent.metadata.spins);

  if (
    !userId ||
    !Number.isInteger(spins) ||
    spins < 1 ||
    spins > 100 ||
    paymentIntent.currency !== "usd" ||
    !isValidSpinPayment(paymentIntent.metadata, paymentIntent.amount_received)
  ) {
    console.error("Rejected payment with invalid Spin4Chinuch metadata", paymentIntent.id);
    return NextResponse.json({ error: "Invalid payment metadata" }, { status: 400 });
  }

  let settlement;
  try {
    settlement = await settlePayment(stripe, paymentIntent);
  } catch (error) {
    console.error("Unable to settle completed payment", paymentIntent.id, error);
    return NextResponse.json({ error: "Unable to settle payment" }, { status: 500 });
  }

  if (settlement.status === "succeeded") {
    try {
      await deliverPurchaseEmail(stripe, paymentIntent.id);
    } catch (error) {
      // Keep credited spins available while Stripe retries email delivery.
      console.error("Purchase confirmation email needs another attempt", paymentIntent.id, error);
      return NextResponse.json({ error: "Unable to confirm purchase email delivery" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
