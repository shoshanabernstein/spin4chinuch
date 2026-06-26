import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        // Get user
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("email, spins_remaining")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (profile.spins_remaining <= 0) {
            return NextResponse.json(
                { error: "No spins remaining" },
                { status: 400 }
            );
        }

        // Get active prizes
        const { data: prizes, error: prizeError } = await supabase
            .from("prizes")
            .select("*")
            .eq("active", true)
            .gt("quantity", 0);

        if (prizeError || !prizes || prizes.length === 0) {
            return NextResponse.json(
                { error: "No prizes available" },
                { status: 400 }
            );
        }

        // Weighted prize  selection
        const total = prizes.reduce(
            (sum, prize) => sum + prize.probability,
            0
        );

        let random = Math.random() * total;

        let winningPrize = prizes[0];

        for (const prize of prizes) {
            random -= prize.probability;

            if (random <= 0) {
                winningPrize = prize;
                break;
            }
        }

        // Deduct one spin
        const { error: spinError } = await supabase
            .from("profiles")
            .update({
                spins_remaining: profile.spins_remaining - 1,
            })
            .eq("id", userId);

        if (spinError) {
            throw spinError;
        }

        // Reduce prize quantity
        await supabase
            .from("prizes")
            .update({
                quantity: winningPrize.quantity - 1,
            })
            .eq("id", winningPrize.id);

        // Save win
        await supabase
            .from("wins")
            .insert({
                user_id: userId,
                prize: winningPrize.name,
                user_email: profile.email,
            });

        return NextResponse.json({
            success: true,
            prize: winningPrize.name,
            prizeId: winningPrize.id,
        });

    } catch (err) {
        console.error(err);

        return NextResponse.json(
            { error: "Spin failed" },
            { status: 500 }
        );
    }
}