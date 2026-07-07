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
    return new NextResponse("Missing Stripe Signature", { status: 400 });
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
    return new NextResponse("Webhook Error", { status: 400 });
  }

  // ✅ ONLY handle successful payments
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const paymentIntentId = paymentIntent.id;
    const userId = paymentIntent.metadata?.userId;
    const spins = Number(paymentIntent.metadata?.spins || 0);
    const amount = paymentIntent.amount;

    if (!userId || spins <= 0) {
      console.error("Missing metadata");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // 🛡️ STEP 1: CHECK IF ALREADY PROCESSED (IDEMPOTENCY)
    const { data: existing } = await supabase
      .from("payment_logs")
      .select("*")
      .eq("payment_intent_id", paymentIntentId)
      .single();

    if (existing) {
      console.log("Duplicate webhook ignored:", paymentIntentId);
      return NextResponse.json({ received: true });
    }

    // 🧾 STEP 2: GET USER PROFILE
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

    // 🔄 STEP 3: UPDATE SPINS
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        spins_remaining: currentSpins + spins,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Update Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update spins" },
        { status: 500 }
      );
    }

    // 🧾 STEP 4: LOG PAYMENT (PREVENT DUPLICATES)
    const { error: logError } = await supabase.from("payment_logs").insert({
      payment_intent_id: paymentIntentId,
      user_id: userId,
      spins,
      amount,
    });

    if (logError) {
      console.error("Log Error:", logError);
    }

    console.log("Spins added successfully:", spins);
  }

  return NextResponse.json({ received: true });
}