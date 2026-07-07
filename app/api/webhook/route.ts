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
    console.error("Webhook signature error:", err);

    return new NextResponse("Invalid signature", {
      status: 400,
    });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  const paymentIntentId = paymentIntent.id;
  const userId = paymentIntent.metadata.userId;
  const spins = Number(paymentIntent.metadata.spins ?? 0);
  const amount = paymentIntent.amount;

  console.log("========== PAYMENT RECEIVED ==========");
  console.log({
    paymentIntentId,
    userId,
    spins,
    amount,
  });

  if (!userId || spins <= 0) {
    console.error("Missing metadata", paymentIntent.metadata);

    return NextResponse.json(
      {
        error: "Missing metadata",
      },
      {
        status: 400,
      }
    );
  }

  // --------------------------------------------------
  // Prevent duplicate webhook processing
  // --------------------------------------------------

  const { data: existing, error: existingError } = await supabase
    .from("payment_logs")
    .select("id")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (existingError) {
    console.error("Duplicate lookup failed:", existingError);
  }

  if (existing) {
    console.log("Already processed:", paymentIntentId);

    return NextResponse.json({
      received: true,
    });
  }

  // --------------------------------------------------
  // Load profile
  // --------------------------------------------------

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("remaining_spins,total_spins")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Profile not found:", profileError);

    return NextResponse.json(
      {
        error: "Profile not found",
      },
      {
        status: 404,
      }
    );
  }

  console.log("Profile BEFORE:", profile);

  const remainingSpins = profile.remaining_spins ?? 0;
  const totalSpins = profile.total_spins ?? 0;

  // --------------------------------------------------
  // Update profile
  // --------------------------------------------------

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({
      remaining_spins: remainingSpins + spins,
      total_spins: totalSpins + spins,
    })
    .eq("id", userId)
    .select("remaining_spins,total_spins")
    .single();

  if (updateError) {
    console.error("Failed updating profile:", updateError);

    return NextResponse.json(
      {
        error: "Unable to update profile",
      },
      {
        status: 500,
      }
    );
  }

  console.log("Profile AFTER:", updatedProfile);

  // --------------------------------------------------
  // Save payment log
  // --------------------------------------------------

  const { error: logError } = await supabase
    .from("payment_logs")
    .insert({
      payment_intent_id: paymentIntentId,
      user_id: userId,
      spins,
      amount,
    });

  if (logError) {
    console.error("Payment log error:", logError);

    return NextResponse.json(
      {
        error: "Failed logging payment",
      },
      {
        status: 500,
      }
    );
  }

  console.log("Payment logged.");
  console.log("Webhook completed successfully.");

  return NextResponse.json({
    received: true,
  });
}