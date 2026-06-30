import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !serviceKey || !anonKey) {
            return NextResponse.json({ error: "Spin service is not configured" }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey);
        const supabaseAuth = createClient(supabaseUrl, anonKey);

        const token = req.headers.get("authorization")?.replace("Bearer ", "");

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

        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("email, spins_remaining")
            .eq("id", user.id)
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

        const { data: prizes, error: prizeError } = await supabaseAdmin
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

        const total = prizes.reduce(
            (sum, outcome) => sum + outcome.probability,
            0
        );

        if (total <= 0) {
            return NextResponse.json(
                { error: "No prizes available" },
                { status: 400 }
            );
        }

        let random = Math.random() * total;
        let winningPrize = prizes[0];

        for (const outcome of prizes) {
            random -= outcome.probability;

            if (random <= 0) {
                winningPrize = outcome;
                break;
            }
        }

        const { error: spinError } = await supabaseAdmin
            .from("profiles")
            .update({
                spins_remaining: profile.spins_remaining - 1,
            })
            .eq("id", user.id);

        if (spinError) {
            throw spinError;
        }

        await supabaseAdmin
            .from("prizes")
            .update({
                quantity: winningPrize.quantity - 1,
            })
            .eq("id", winningPrize.id);

        await supabaseAdmin
            .from("wins")
            .insert({
                user_id: user.id,
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
