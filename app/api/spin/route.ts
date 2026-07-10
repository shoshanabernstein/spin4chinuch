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

type WheelOutcome = {
  id: number;
  label: string;
  probability: number;
  prize_id: number | null;
};

type Prize = {
  id: number;
  name: string;
  quantity: number;
  retail_value: number | null;
  sponsor_name: string | null;
  delivery_type: string | null;
  delivery_instructions: string | null;
};

export async function POST(req: Request) {
  try {
    // Authenticate
    const token = req.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Load profile
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("email, remaining_spins")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      console.error(profileError);

      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.remaining_spins <= 0) {
      return NextResponse.json(
        { error: "No spins remaining." },
        { status: 400 }
      );
    }

    // Load wheel
    const { data: outcomes, error: outcomesError } =
      await supabaseAdmin
        .from("wheel_outcomes")
        .select("id,label,probability,prize_id")
        .eq("active", true);

    if (outcomesError || !outcomes?.length) {
      console.error(outcomesError);

      return NextResponse.json(
        { error: "No wheel outcomes." },
        { status: 400 }
      );
    }

    const wheel = outcomes as WheelOutcome[];

    // Weighted random
    const totalWeight = wheel.reduce(
      (sum, o) => sum + o.probability,
      0
    );

    let random = Math.random() * totalWeight;

    let winningOutcome = wheel[0];

    for (const outcome of wheel) {
      random -= outcome.probability;

      if (random <= 0) {
        winningOutcome = outcome;
        break;
      }
    }

    console.log("Winner:", winningOutcome);

    // Load prize (if there is one)
    let prize: Prize | null = null;

    if (winningOutcome.prize_id) {
      const { data: prizeData, error: prizeError } =
        await supabaseAdmin
          .from("prizes")
          .select("*")
          .eq("id", winningOutcome.prize_id)
          .single();

      if (prizeError) {
        console.error(prizeError);
      } else {
        prize = prizeData as Prize;
      }
    }

    console.log("Prize:", prize);

    // Deduct spin
    const { error: spinError } =
      await supabaseAdmin
        .from("profiles")
        .update({
          remaining_spins:
            profile.remaining_spins - 1,
        })
        .eq("id", user.id);

    if (spinError) throw spinError;

    // Winner
    if (prize) {

      if (prize.quantity > 0) {
        const { error } =
          await supabaseAdmin
            .from("prizes")
            .update({
              quantity: prize.quantity - 1,
            })
            .eq("id", prize.id);

        if (error) throw error;
      }

      const { error } =
        await supabaseAdmin
          .from("wins")
          .insert({
            user_id: user.id,
            user_email: profile.email,
            prize: prize.name,
            prize_id: prize.id,
            outcome_id: winningOutcome.id,
            retail_value: prize.retail_value,
            sponsor_name: prize.sponsor_name,
            delivery_type: prize.delivery_type,
            delivery_instructions:
              prize.delivery_instructions,
            status: "Pending",
          });

      if (error) throw error;
    }

    // Spin history
    const { error: historyError } =
      await supabaseAdmin
        .from("spin_history")
        .insert({
          user_id: user.id,
          outcome_id: winningOutcome.id,
          won: prize !== null,
        });

    if (historyError) throw historyError;

    return NextResponse.json({
      success: true,


      outcomeId: winningOutcome.id,

      prizeId: prize?.id ?? null,

      winner: {
        won: prize !== null,

        outcomeId: winningOutcome.id,

        outcomeLabel: winningOutcome.label,

        prize: prize
          ? {
            id: prize.id,
            name: prize.name,
            retailValue: prize.retail_value,
            sponsor: prize.sponsor_name,
          }
          : null,
      },

      remainingSpins: profile.remaining_spins - 1,
      won: prize !== null,

      outcomeLabel: winningOutcome.label,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Spin failed",
      },
      {
        status: 500,
      }
    );
  }
}