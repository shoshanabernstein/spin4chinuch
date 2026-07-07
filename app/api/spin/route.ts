import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export async function POST(req: Request) {

  try {

    const token = req.headers
      .get("authorization")
      ?.replace("Bearer ", "");


    if (!token) {

      return NextResponse.json(
        { error: "Please log in." },
        { status: 401 }
      );

    }



    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);



    if (authError || !user) {

      return NextResponse.json(
        { error: "Please log in." },
        { status: 401 }
      );

    }





    // Get user spins

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select(
          "email, remaining_spins"
        )
        .eq("id", user.id)
        .single();



    if (profileError || !profile) {

      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );

    }





    if (profile.remaining_spins <= 0) {

      return NextResponse.json(
        { error: "No spins remaining" },
        { status: 400 }
      );

    }







    // Get wheel outcomes

    const { data: outcomes, error: outcomeError } =
      await supabaseAdmin
        .from("wheel_outcomes")
        .select(`
          id,
          label,
          probability,
          prize_id,
          prizes (
            id,
            name,
            quantity,
            retail_value,
            sponsor_name,
            delivery_type,
            delivery_instructions
          )
        `)
        .eq("active", true);



    if (
      outcomeError ||
      !outcomes ||
      outcomes.length === 0
    ) {

      return NextResponse.json(
        { error: "No outcomes available" },
        { status: 400 }
      );

    }






    // Weighted random selection

    const totalProbability =
      outcomes.reduce(
        (sum, outcome) =>
          sum + outcome.probability,
        0
      );



    let random =
      Math.random() * totalProbability;



    let winningOutcome =
      outcomes[0];



    for (const outcome of outcomes) {

      random -= outcome.probability;


      if (random <= 0) {

        winningOutcome = outcome;
        break;

      }

    }







    // Deduct spin

    const { error: updateSpinError } =
      await supabaseAdmin
        .from("profiles")
        .update({

          remaining_spins:
            profile.remaining_spins - 1

        })
        .eq("id", user.id);



    if(updateSpinError){

      throw updateSpinError;

    }








    // Supabase returns relation as array

    const prize =
      winningOutcome.prizes?.[0] ?? null;








    // If user won a prize

    if(prize){



      const { error: quantityError } =
        await supabaseAdmin
          .from("prizes")
          .update({

            quantity:
              prize.quantity - 1

          })
          .eq(
            "id",
            prize.id
          );



      if(quantityError){

        throw quantityError;

      }







      const { error: winError } =
        await supabaseAdmin
          .from("wins")
          .insert({

            user_id:user.id,

            user_email:
              profile.email,

            prize:
              prize.name,

            prize_id:
              prize.id,

            outcome_id:
              winningOutcome.id,

            retail_value:
              prize.retail_value,

            sponsor_name:
              prize.sponsor_name,

            delivery_type:
              prize.delivery_type,

            delivery_instructions:
              prize.delivery_instructions,

          });



      if(winError){

        throw winError;

      }


    }









    // Record every spin

    const { error: historyError } =
      await supabaseAdmin
        .from("spin_history")
        .insert({

          user_id:user.id,

          outcome_id:
            winningOutcome.id,

          won:
            !!prize,

        });



    if(historyError){

      throw historyError;

    }









    return NextResponse.json({

      success:true,

      outcomeId:
        winningOutcome.id,

      prizeId:
        prize?.id ?? null,

      prize:
        prize
          ? prize.name
          : winningOutcome.label,

    });







  } catch(error){

    console.error(
      "SPIN ERROR:",
      error
    );


    return NextResponse.json(

      {
        error:"Spin failed"
      },

      {
        status:500
      }

    );

  }

}