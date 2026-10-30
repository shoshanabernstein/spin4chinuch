import { settlePayment } from "@/lib/server/settle-payment";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestUser } from "@/lib/server/supabase";
import { isValidSpinPayment } from "@/lib/spin-pricing";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(secretKey);

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paymentIntentId = new URL(req.url).searchParams.get("payment_intent");
  if (!paymentIntentId?.startsWith("pi_")) {
    return NextResponse.json({ error: "Missing payment confirmation." }, { status: 400 });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== user.id) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }

    const spins = Number(paymentIntent.metadata.spins);

    if (paymentIntent.status === "succeeded") {
      if (
        !Number.isInteger(spins) ||
        spins < 1 ||
        spins > 100 ||
        paymentIntent.currency !== "usd" ||
        !isValidSpinPayment(paymentIntent.metadata, paymentIntent.amount_received)
      ) {
        console.error("Rejected verified payment with invalid metadata", paymentIntent.id);
        return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
      }

      try {
        return NextResponse.json(await settlePayment(stripe, paymentIntent));
      } catch (error) {
        console.error("Unable to settle verified payment", paymentIntent.id, error);
        return NextResponse.json(
          { error: "Payment received, but confirmation needs another attempt. Please check your dashboard or contact support before purchasing again." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({
      status: paymentIntent.status,
      spins: Number.isInteger(spins) ? spins : 0,
    });
  } catch (error) {
    console.error("Unable to verify payment status", error);
    return NextResponse.json({ error: "Unable to verify this payment." }, { status: 400 });
  }
}
