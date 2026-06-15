import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { spins } = await req.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not logged in" },
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

    const session =
      await stripe.checkout.sessions.create({
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

        success_url:
          "http://localhost:3000/success",

        cancel_url:
          "http://localhost:3000/buy-spins",

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
      {
        error: "Checkout creation failed",
      },
      {
        status: 500,
      }
    );
  }
}