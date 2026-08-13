import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = (await req.json()) as { prizeId?: unknown };
  const prizeId = Number(body.prizeId);
  if (!Number.isInteger(prizeId) || prizeId < 1) {
    return NextResponse.json({ error: "A valid prize is required." }, { status: 400 });
  }

  const [{ data: prize, error: prizeError }, outcomeResult] = await Promise.all([
    supabaseAdmin.from("prizes").select("id,name").eq("id", prizeId).maybeSingle(),
    supabaseAdmin
      .from("wheel_outcomes")
      .select("*")
      .eq("prize_id", prizeId),
  ]);

  if (prizeError) {
    return NextResponse.json({ error: prizeError.message }, { status: 500 });
  }
  if (!prize) {
    return NextResponse.json({ error: "Prize not found." }, { status: 404 });
  }
  if (outcomeResult.error) {
    return NextResponse.json({ error: outcomeResult.error.message }, { status: 500 });
  }
  const linkedOutcomes = outcomeResult.data ?? [];
  const outcomeIds = linkedOutcomes.map((outcome) => outcome.id);
  let linkedWins: Array<{ id: number; outcome_id: number | null; prize_id: number | null }> = [];
  let linkedSpinHistory: Record<string, unknown>[] = [];

  if (outcomeIds.length > 0) {
    const [winsResult, historyResult] = await Promise.all([
      supabaseAdmin
        .from("wins")
        .select("id,outcome_id,prize_id")
        .in("outcome_id", outcomeIds),
      supabaseAdmin
        .from("spin_history")
        .select("*")
        .in("outcome_id", outcomeIds),
    ]);

    if (winsResult.error || historyResult.error) {
      return NextResponse.json(
        { error: winsResult.error?.message || historyResult.error?.message },
        { status: 500 }
      );
    }

    linkedWins = winsResult.data ?? [];
    linkedSpinHistory = historyResult.data ?? [];
  }

  async function restoreWinnerLinks() {
    await Promise.all(
      linkedWins.map((win) =>
        supabaseAdmin
          .from("wins")
          .update({ outcome_id: win.outcome_id, prize_id: win.prize_id })
          .eq("id", win.id)
      )
    );
  }

  if (linkedOutcomes.length > 0) {
    if (linkedWins.length > 0) {
      const { error: detachError } = await supabaseAdmin
        .from("wins")
        .update({ outcome_id: null, prize_id: null })
        .in("outcome_id", outcomeIds);

      if (detachError) {
        return NextResponse.json({ error: detachError.message }, { status: 500 });
      }
    }

    if (linkedSpinHistory.length > 0) {
      const { error: historyDeleteError } = await supabaseAdmin
        .from("spin_history")
        .delete()
        .in("outcome_id", outcomeIds);

      if (historyDeleteError) {
        await restoreWinnerLinks();
        return NextResponse.json({ error: historyDeleteError.message }, { status: 500 });
      }
    }

    const { error: outcomeDeleteError } = await supabaseAdmin
      .from("wheel_outcomes")
      .delete()
      .eq("prize_id", prizeId);

    if (outcomeDeleteError) {
      if (linkedSpinHistory.length > 0) {
        await supabaseAdmin.from("spin_history").insert(linkedSpinHistory);
      }
      await restoreWinnerLinks();
      return NextResponse.json({ error: outcomeDeleteError.message }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabaseAdmin.from("prizes").delete().eq("id", prizeId);
  if (deleteError) {
    if (linkedOutcomes.length > 0) {
      const { error: restoreError } = await supabaseAdmin
        .from("wheel_outcomes")
        .insert(linkedOutcomes);
      if (restoreError) {
        console.error("Unable to restore wheel outcomes after prize deletion failed", restoreError);
      } else {
        if (linkedSpinHistory.length > 0) {
          const { error: historyRestoreError } = await supabaseAdmin
            .from("spin_history")
            .insert(linkedSpinHistory);
          if (historyRestoreError) console.error("Unable to restore spin history", historyRestoreError);
        }
        await restoreWinnerLinks();
      }
    }
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deletedPrize: prize.name,
    deletedOutcomes: linkedOutcomes.length,
    preservedWinners: linkedWins.length,
    deletedSpinHistory: linkedSpinHistory.length,
  });
}
