import { NextResponse } from "next/server";
import { getRequestUser, supabaseAdmin } from "@/lib/server/supabase";
import { sendWinEmail } from "@/lib/server/win-email";
import { deliverGiftCard, giftCardsEnabled } from "@/lib/server/gift-cards";
import { notifyPrizeSponsor } from "@/lib/server/sponsor-notification";

type SpinResult = {
  winId?: number | null;
  outcomeId: number;
  outcomeLabel: string;
  remainingSpins: number;
  won: boolean;
  spinAgain: boolean;
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

  const useGiftCards = giftCardsEnabled();
  const { data, error } = await supabaseAdmin.rpc(useGiftCards ? "perform_spin_with_gift_cards" : "perform_spin", {
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
    let useStandardEmail = !useGiftCards;
    if (useGiftCards) {
      try {
        if (!result.winId) throw new Error("Missing win ID for gift card delivery");
        useStandardEmail = !(await deliverGiftCard(result.winId));
      } catch (emailError) {
        console.error("Gift card delivery requires administrator review", emailError);
      }
    }
    if (useStandardEmail) {
      const { data: prizeDetails, error: prizeDetailsError } = await supabaseAdmin
        .from("prizes")
        .select("image_url")
        .eq("id", result.prize.id)
        .maybeSingle();

      if (prizeDetailsError) {
        console.error("Could not load the winner email prize image", prizeDetailsError);
      }

      await sendWinEmail(user.email, result.prize.name, prizeDetails?.image_url).catch((emailError) => {
        console.error("Win email failed", emailError);
      });
      await notifyPrizeSponsor(result.prize.id, user.id, user.email, result.prize.name, result.winId).catch((emailError) => {
        console.error("Sponsor notification failed", emailError);
      });
    }
  }

  return NextResponse.json({
    success: true,
    outcomeId: result.outcomeId,
    outcomeLabel: result.outcomeLabel,
    remainingSpins: result.remainingSpins,
    won: result.won,
    spinAgain: result.spinAgain,
    winner: {
      won: result.won,
      spinAgain: result.spinAgain,
      outcomeId: result.outcomeId,
      outcomeLabel: result.outcomeLabel,
      prize: result.prize,
    },
  });
}
