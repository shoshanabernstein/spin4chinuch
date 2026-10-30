import { NextResponse } from "next/server";
import { getRequestUser, supabaseAdmin } from "@/lib/server/supabase";
import { sendWinEmail } from "@/lib/server/win-email";
import { deliverGiftCard, giftCardsEnabled } from "@/lib/server/gift-cards";
import { notifyPrizeSponsor } from "@/lib/server/sponsor-notification";

type SpinResult = {
  discountAwardCents?: number;
  replayed?: boolean;
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

  let requestId: unknown;
  try {
    ({ requestId } = await req.json());
  } catch {
    return NextResponse.json({ error: "A valid spin request ID is required." }, { status: 400 });
  }
  if (typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return NextResponse.json({ error: "A valid spin request ID is required." }, { status: 400 });
  }

  const useGiftCards = giftCardsEnabled();
  const { data, error } = await supabaseAdmin.rpc("perform_spin_once", {
    p_user_id: user.id,
    p_request_id: requestId,
    p_gift_cards: useGiftCards,
  });

  if (error) {
    console.error("Spin transaction failed", error);
    const message = error.message.includes("No spins")
      ? "No spins remaining."
      : error.message.includes("No eligible")
        ? "No prizes are currently available."
        : "Unable to confirm the spin. Retry to recover the same result.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const result = data as SpinResult;
  if (!result.replayed && result.won && result.prize?.name && user.email) {
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

  const resultLabel = result.discountAwardCents
    ? `You earned $${result.discountAwardCents / 100} off your next purchase!`
    : result.outcomeLabel;
  return NextResponse.json({
    success: true,
    outcomeId: result.outcomeId,
    outcomeLabel: resultLabel,
    remainingSpins: result.remainingSpins,
    won: result.won,
    spinAgain: result.spinAgain,
    discountAwardCents: result.discountAwardCents ?? 0,
    winner: {
      won: result.won,
      spinAgain: result.spinAgain,
      outcomeId: result.outcomeId,
      outcomeLabel: resultLabel,
      prize: result.prize,
    },
  });
}
