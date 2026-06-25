import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  console.log("🔥 WEBHOOK HIT");

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

  console.log("EVENT:", event.type);

  if (event.type === "checkout.session.completed") {
    console.log("WEBHOOK FIRED");

    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const spins = Number(session.metadata?.spins || 0);

    console.log("USERID:", userId);
    console.log("SPINS:", spins);

    if (!userId || spins <= 0) {
      console.log("Missing metadata");

      return NextResponse.json({
        error: "Missing metadata",
      });
    }

    // Get current spins
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("spins_remaining")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile Error:", profileError);

      return NextResponse.json({
        error: "Profile not found",
      });
    }

    const currentSpins = profile.spins_remaining ?? 0;

    // Update spins
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        spins_remaining: currentSpins + spins,
      })
      .eq("id", userId)
      .select();

    console.log("UPDATED PROFILE:", updatedProfile);
    console.log("UPDATE ERROR:", updateError);

    if (updateError) {
      console.error("Update Error:", updateError);
    } else {
      console.log(`✅ Added ${spins} spins to ${userId}`);
    }
  }

  return NextResponse.json({
    received: true,
  });
}