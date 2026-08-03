import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestUser, supabaseAdmin } from "@/lib/server/supabase";

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
      const expectedAmount = spins * 1800;
      if (
        !Number.isInteger(spins) ||
        spins < 1 ||
        spins > 100 ||
        paymentIntent.currency !== "usd" ||
        paymentIntent.amount_received !== expectedAmount
      ) {
        console.error("Rejected verified payment with invalid metadata", paymentIntent.id);
        return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
      }

      const { error: creditError } = await supabaseAdmin.rpc(
        "credit_completed_payment",
        {
          p_payment_intent_id: paymentIntent.id,
          p_user_id: user.id,
          p_spins: spins,
          p_amount: paymentIntent.amount_received,
        }
      );

      if (creditError) {
        console.error("Unable to credit verified payment", paymentIntent.id, creditError);
        return NextResponse.json(
          { error: "Payment was verified, but spins could not be credited yet." },
          { status: 500 }
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
