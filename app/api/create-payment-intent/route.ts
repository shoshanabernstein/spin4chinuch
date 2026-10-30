import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestUser, supabaseAdmin } from "@/lib/server/supabase";
import { remainingSpinsForSale, SOLD_OUT_MESSAGE } from "@/lib/spin-sales";
import { getSpinOrderAmount, SPIN_PRICING_VERSION } from "@/lib/spin-pricing";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(secretKey);
const MAX_SPINS_PER_ORDER = 100;

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { quantity?: unknown; packageId?: unknown };
    const quantity = Number(body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_SPINS_PER_ORDER) {
      return NextResponse.json(
        { error: `Quantity must be an integer from 1 to ${MAX_SPINS_PER_ORDER}.` },
        { status: 400 }
      );
    }

    const packageId = body.packageId ?? "individual";
    let amount;
    try {
      amount = getSpinOrderAmount(quantity, packageId);
    } catch {
      return NextResponse.json({ error: "Choose a valid spin package." }, { status: 400 });
    }

    const { data: soldSpins, error: soldSpinsError } = await supabaseAdmin.rpc("sold_spin_count");
    if (soldSpinsError) throw soldSpinsError;
    const spinsRemaining = remainingSpinsForSale(soldSpins);
    if (quantity > spinsRemaining) {
      return NextResponse.json(
        { error: spinsRemaining === 0 ? SOLD_OUT_MESSAGE : `Only ${spinsRemaining} spins remain.` },
        { status: 409 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user.id,
        spins: String(quantity),
        pricingVersion: SPIN_PRICING_VERSION,
        packageId: String(packageId),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, quantity, amount, packageId });
  } catch (error) {
    console.error("Payment intent creation failed", error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
