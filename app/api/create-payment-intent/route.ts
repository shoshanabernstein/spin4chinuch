import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestUser, supabaseAdmin } from "@/lib/server/supabase";
import { remainingSpinsForSale, SOLD_OUT_MESSAGE } from "@/lib/spin-sales";
import { getSpinOrderAmount, SPIN_PRICING_VERSION } from "@/lib/spin-pricing";
import { randomUUID } from "node:crypto";
import { deliverFreePurchaseEmail } from "@/lib/server/free-purchase-email";

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

    const body = (await req.json()) as { quantity?: unknown; packageId?: unknown; checkoutRequestId?: unknown };
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

    const requestId = body.checkoutRequestId ?? randomUUID();
    if (typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
    }
    const { data: quote, error: quoteError } = body.checkoutRequestId === undefined ? { data: null, error: null } : await supabaseAdmin.rpc("create_discount_quote", {
      p_id: requestId, p_user_id: user.id, p_spins: quantity, p_package_id: packageId,
    });
    if (quoteError && quoteError.code !== "PGRST202") throw quoteError;
    if (quantity > spinsRemaining && !quote?.completed) {
      return NextResponse.json({ error: spinsRemaining === 0 ? SOLD_OUT_MESSAGE : `Only ${spinsRemaining} spins remain.` }, { status: 409 });
    }
    if (quote) {
      if (quote.amount === 0) {
        const { error: completeError } = await supabaseAdmin.rpc("complete_discount_checkout", {
          p_id: quote.id, p_user_id: user.id, p_payment_id: `free_${quote.id}`, p_amount: 0,
        });
        if (completeError) {
          return NextResponse.json({ error: completeError.message === "Discount balance changed" ? "Your discount balance changed. Refresh and try again." : "Unable to complete this purchase. Please check your dashboard before trying again." }, { status: 409 });
        }
        if (user.email) await deliverFreePurchaseEmail(quote.id, user.id, user.email);
        return NextResponse.json({ free: true, amount: 0, quantity, packageId });
      }
      if (quote.completed) return NextResponse.json({ alreadyCompleted: true, quantity, packageId });
      amount = quote.amount;
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount, currency: "usd", automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user.id, spins: String(quantity),
        pricingVersion: quote ? "discounts-v1" : SPIN_PRICING_VERSION,
        packageId: String(packageId),
        ...(quote ? { checkoutQuoteId: quote.id, discountCents: String(quote.discount), subtotalCents: String(quote.subtotal) } : {}),
      },
    }, quote ? { idempotencyKey: `discount-checkout/${quote.id}` } : undefined);
    return NextResponse.json({ clientSecret: paymentIntent.client_secret, quantity, amount, packageId });
  } catch (error) {
    console.error("Payment intent creation failed", error);
    return NextResponse.json({ error: "Unable to start checkout. If a free purchase was already credited, check your dashboard before trying again." }, { status: 500 });
  }
}
