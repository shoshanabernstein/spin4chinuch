import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { spins } = await req.json();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Missing user" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Missing user" },
        { status: 401 }
      );
    }

    const PRICE_PER_SPIN = 1800; // cents

    const amount = spins * PRICE_PER_SPIN;

    if (spins < 1) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${spins} Spin${spins === 1 ? "" : "s"}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${siteUrl}/success`,
      cancel_url: `${siteUrl}/buy-spins`,
      metadata: {
        userId: user.id,
        spins: spins.toString(),
      },
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Checkout creation failed" },
      { status: 500 }
    );
  }
}
