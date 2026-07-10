import { NextResponse } from "next/server";
import { getRequestUser, supabaseAdmin } from "@/lib/server/supabase";
import { sendWinEmail } from "@/lib/server/win-email";

type SpinResult = {
  outcomeId: number;
  outcomeLabel: string;
  remainingSpins: number;
  won: boolean;
  prize: {
    id: number;
    name: string;
    retailValue: number | null;
    sponsor: string | null;
  } | null;
};

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.rpc("perform_spin", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Spin transaction failed", error);
    const message = error.message.includes("No spins")
      ? "No spins remaining."
      : error.message.includes("No eligible")
        ? "No prizes are currently available."
        : "Spin failed. Your balance was not changed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const result = data as SpinResult;
  if (result.won && result.prize?.name && user.email) {
    await sendWinEmail(user.email, result.prize.name).catch((emailError) => {
      console.error("Win email failed", emailError);
    });
  }

  return NextResponse.json({
    success: true,
    outcomeId: result.outcomeId,
    outcomeLabel: result.outcomeLabel,
    remainingSpins: result.remainingSpins,
    won: result.won,
    winner: {
      won: result.won,
      outcomeId: result.outcomeId,
      outcomeLabel: result.outcomeLabel,
      prize: result.prize,
    },
  });
}
