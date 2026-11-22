import { supabaseAdmin } from "@/lib/server/supabase";
import { TOTAL_SPIN_LIMIT } from "@/lib/spin-sales";

/** Total spins for sale: the spin pool's size, which admins can adjust. */
export async function readSpinLimit() {
  const { data, error } = await supabaseAdmin.rpc("spin_limit");
  if (error?.code === "PGRST202") return TOTAL_SPIN_LIMIT;
  if (error) throw error;
  const limit = Number(data);
  if (!Number.isSafeInteger(limit) || limit < 0) throw new Error("Invalid spin limit");
  return limit;
}
