import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing signature", {
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
    console.error("Webhook error:", err);

    return new NextResponse("Webhook Error", {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const spins = Number(session.metadata?.spins || 0);

    if (!userId || spins <= 0) {
      return NextResponse.json({
        error: "Missing metadata",
      });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("spins_remaining")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      console.error(error);

      return NextResponse.json({
        error: "Profile not found",
      });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        spins_remaining:
          (profile.spins_remaining ?? 0) + spins,
      })
      .eq("id", userId);

    if (updateError) {
      console.error(updateError);
    }
  }

  return NextResponse.json({
    received: true,
  });
}