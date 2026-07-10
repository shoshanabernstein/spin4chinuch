import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestUser } from "@/lib/server/supabase";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(secretKey);
const PRICE_PER_SPIN = 1800;
const MAX_SPINS_PER_ORDER = 100;

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { quantity?: unknown };
    const quantity = Number(body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_SPINS_PER_ORDER) {
      return NextResponse.json(
        { error: `Quantity must be an integer from 1 to ${MAX_SPINS_PER_ORDER}.` },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: quantity * PRICE_PER_SPIN,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user.id,
        spins: String(quantity),
        pricePerSpin: String(PRICE_PER_SPIN),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Payment intent creation failed", error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
