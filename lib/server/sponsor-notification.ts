import { supabaseAdmin } from "@/lib/server/supabase";
import { sendSponsorWinEmail } from "@/lib/server/win-email";

export async function notifyPrizeSponsor(prizeId: number, userId: string, winnerEmail: string, prizeName: string, winId?: number | null) {
  const { data: contact, error } = await supabaseAdmin.from("prize_contacts")
    .select("*").eq("prize_id", prizeId).maybeSingle();
  if (error) throw new Error("Could not load sponsor notification settings");
  const email = contact?.notification_email?.trim();
  if (!email) return;
  const { data: profile, error: profileError } = await supabaseAdmin.from("profiles")
    .select("first_name,last_name").eq("id", userId).single();
  if (profileError) throw new Error("Could not load the winner name for sponsor notification");
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Name not provided";
  await sendSponsorWinEmail(email, name, winnerEmail, prizeName, winId);
}
