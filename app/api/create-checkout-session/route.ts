import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!stripeKey || !supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Checkout is not configured" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

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

    let amount = 0;

    if (spins === 10) amount = 1000;
    if (spins === 25) amount = 2000;
    if (spins === 50) amount = 3500;

    if (amount === 0) {
      return NextResponse.json(
        { error: "Invalid package" },
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
              name: `${spins} Spin Package`,
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
