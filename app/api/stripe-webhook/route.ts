import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../../lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.log("Webhook error:", err);
    return new NextResponse("Webhook failed", {
      status: 400,
    });
  }


  if (event.type === "checkout.session.completed") {

    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const spins = Number(session.metadata?.spins);


    if (!userId || !spins) {
      return NextResponse.json({
        error: "missing metadata"
      });
    }


    const { data: profile, error } = await supabase
      .from("profiles")
      .select("spins_remaining")
      .eq("id", userId)
      .single();


    if (error) {
      console.log(error);
      return NextResponse.json({
        error: "profile not found"
      });
    }


    await supabase
      .from("profiles")
      .update({
        spins_remaining:
          (profile.spins_remaining ?? 0) + spins,
      })
      .eq("id", userId);

  }


  return NextResponse.json({
    received: true,
  });
}