import { getRequestUser, supabaseAdmin } from "@/lib/server/supabase";

export async function requireAdmin(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return { error: "Unauthorized", status: 401 } as const;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    return { error: "Administrator access required", status: 403 } as const;
  }

  return { user } as const;
}
