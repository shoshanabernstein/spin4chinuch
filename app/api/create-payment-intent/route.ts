import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_PER_SPIN = 1800;

export async function POST(req: Request) {
  try {
    const { quantity, userId } = await req.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    const amount = quantity * PRICE_PER_SPIN;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId,
        spins: quantity.toString(),
      },
    });

    console.log(paymentIntent.payment_method_types);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Payment intent failed" },
      { status: 500 }
    );
  }
}