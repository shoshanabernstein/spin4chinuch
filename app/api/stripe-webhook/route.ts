import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing Stripe Signature", {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook Error:", err);

    return new NextResponse("Webhook Error", {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const spins = Number(session.metadata?.spins || 0);

    if (!userId || spins <= 0) {
      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("spins_remaining")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile Error:", profileError);

      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const currentSpins = profile.spins_remaining ?? 0;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        spins_remaining: currentSpins + spins,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Update Error:", updateError);

      return NextResponse.json(
        { error: "Unable to add spins" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    received: true,
  });
}
