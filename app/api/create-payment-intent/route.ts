import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestUser, supabaseAdmin } from "@/lib/server/supabase";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(secretKey);
const PRICE_PER_SPIN = 1800;
const MAX_SPINS_PER_ORDER = 100;
const TOTAL_SPIN_LIMIT = 2000;

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

    const { data: soldSpins, error: soldSpinsError } = await supabaseAdmin.rpc("sold_spin_count");
    if (soldSpinsError) throw soldSpinsError;
    const spinsRemaining = Math.max(0, TOTAL_SPIN_LIMIT - Number(soldSpins ?? 0));
    if (quantity > spinsRemaining) {
      return NextResponse.json(
        { error: spinsRemaining === 0 ? "All 2,000 spins have been sold." : `Only ${spinsRemaining} spins remain.` },
        { status: 409 }
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
