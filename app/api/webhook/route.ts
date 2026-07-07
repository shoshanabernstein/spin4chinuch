import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";


const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);



export async function POST(req: Request) {

  const body = await req.text();

  const signature =
    req.headers.get("stripe-signature");



  if (!signature) {

    return new NextResponse(
      "Missing Stripe Signature",
      {
        status: 400
      }
    );

  }




  let event: Stripe.Event;


  try {


    event =
      stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );


  } catch (error) {


    console.error(
      "Webhook Error:",
      error
    );


    return new NextResponse(
      "Webhook Error",
      {
        status: 400
      }
    );

  }






  if (
    event.type ===
    "payment_intent.succeeded"
  ) {


    const paymentIntent =
      event.data.object as Stripe.PaymentIntent;



    const paymentIntentId =
      paymentIntent.id;



    const userId =
      paymentIntent.metadata?.userId;



    const spins =
      Number(
        paymentIntent.metadata?.spins || 0
      );

    console.log("WEBHOOK METADATA:", {
      userId,
      spins,
      metadata: paymentIntent.metadata,
    });


    const amount =
      paymentIntent.amount;





    if (!userId || spins <= 0) {

      console.error(
        "Missing metadata",
        paymentIntent.metadata
      );


      return NextResponse.json(
        {
          error: "Missing metadata"
        },
        {
          status: 400
        }
      );

    }







    // Prevent duplicate processing

    const { data: existing } =
      await supabase
        .from("payment_logs")
        .select("id")
        .eq(
          "payment_intent_id",
          paymentIntentId
        )
        .maybeSingle();




    if (existing) {

      console.log(
        "Already processed",
        paymentIntentId
      );


      return NextResponse.json({
        received: true
      });

    }







    // Get current spins
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "remaining_spins,total_spins"
        )
        .eq(
          "id",
          userId
        )
        .single();


    console.log("PROFILE FOUND:", profile);
    console.log("PROFILE ERROR:", profileError);

    if (profileError || !profile) {


      console.error(
        "Profile Error:",
        profileError
      );


      return NextResponse.json(
        {
          error: "Profile not found"
        },
        {
          status: 404
        }
      );


    }






    const currentRemaining =
      profile.remaining_spins ?? 0;


    const currentTotal =
      profile.total_spins ?? 0;








    // Add spins

    const { error: updateError } =
      await supabase
        .from("profiles")
        .update({

          remaining_spins:
            currentRemaining + spins,

          total_spins:
            currentTotal + spins,

        })
        .eq(
          "id",
          userId
        );

    console.log("UPDATE ERROR:", updateError);




    if (updateError) {


      console.error(
        "Spin Update Error:",
        updateError
      );


      return NextResponse.json(
        {
          error: "Failed updating spins"
        },
        {
          status: 500
        }
      );


    }








    // Save payment log

    const { error: logError } =
      await supabase
        .from("payment_logs")
        .insert({

          payment_intent_id:
            paymentIntentId,

          user_id:
            userId,

          spins,

          amount,

        });





    if (logError) {

      console.error(
        "Payment log error:",
        logError
      );

    }

    console.log(
      "SUCCESS - Added spins:",
      spins
    );

  }

  return NextResponse.json({
    received: true
  });

}