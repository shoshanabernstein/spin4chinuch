import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/server/supabase";

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
  const expectedAmount = spins * 1800;

  if (
    !userId ||
    !Number.isInteger(spins) ||
    spins < 1 ||
    spins > 100 ||
    paymentIntent.currency !== "usd" ||
    paymentIntent.amount_received !== expectedAmount
  ) {
    console.error("Rejected payment with invalid Spin4Chinuch metadata", paymentIntent.id);
    return NextResponse.json({ error: "Invalid payment metadata" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.rpc("credit_completed_payment", {
    p_payment_intent_id: paymentIntent.id,
    p_user_id: userId,
    p_spins: spins,
    p_amount: paymentIntent.amount_received,
  });

  if (error) {
    console.error("Unable to credit completed payment", paymentIntent.id, error);
    return NextResponse.json({ error: "Unable to credit payment" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
