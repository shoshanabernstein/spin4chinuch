import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";

type UpdateBody = {
  userId?: unknown;
  role?: unknown;
  remainingSpins?: unknown;
  active?: unknown;
};

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const [{ data: authData, error: authError }, { data: profiles, error: profileError }] =
    await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin
        .from("profiles")
        .select("id,email,first_name,last_name,city,state,role,remaining_spins,total_spins"),
    ]);

  if (authError || profileError) {
    return NextResponse.json(
      { error: authError?.message || profileError?.message || "Unable to load users." },
      { status: 500 }
    );
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const users = authData.users.map((user) => {
    const profile = profilesById.get(user.id);
    const bannedUntil = user.banned_until ? new Date(user.banned_until) : null;
    return {
      id: user.id,
      email: user.email ?? profile?.email ?? "",
      firstName: profile?.first_name ?? "",
      lastName: profile?.last_name ?? "",
      city: profile?.city ?? "",
      state: profile?.state ?? "",
      role: profile?.role ?? "user",
      remainingSpins: profile?.remaining_spins ?? 0,
      totalSpins: profile?.total_spins ?? 0,
      active: !bannedUntil || bannedUntil <= new Date(),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      isCurrentAdmin: user.id === admin.user.id,
    };
  });

  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = (await req.json()) as UpdateBody;
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) {
    return NextResponse.json({ error: "A user is required." }, { status: 400 });
  }

  if (userId === admin.user.id && (body.active === false || body.role === "user")) {
    return NextResponse.json(
      { error: "You cannot deactivate or demote your own administrator account." },
      { status: 400 }
    );
  }

  const profileChanges: { role?: "admin" | "user"; remaining_spins?: number } = {};
  if (body.role !== undefined) {
    if (body.role !== "admin" && body.role !== "user") {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    profileChanges.role = body.role;
  }

  if (body.remainingSpins !== undefined) {
    const remainingSpins = Number(body.remainingSpins);
    if (!Number.isInteger(remainingSpins) || remainingSpins < 0 || remainingSpins > 100000) {
      return NextResponse.json(
        { error: "Spin balance must be a whole number from 0 to 100,000." },
        { status: 400 }
      );
    }
    profileChanges.remaining_spins = remainingSpins;
  }

  if (Object.keys(profileChanges).length > 0) {
    const { error } = await supabaseAdmin.from("profiles").update(profileChanges).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Invalid account status." }, { status: 400 });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: body.active ? "none" : "876000h",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
