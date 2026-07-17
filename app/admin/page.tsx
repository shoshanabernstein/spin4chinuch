/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Gift,
  LayoutDashboard,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AdminSection = "overview" | "prizes" | "users" | "winners" | "settings";

type Prize = {
  id: string | number;
  name: string;
  quantity: number | null;
  probability: number | null;
  active: boolean | null;
  created_at: string;
  image_url?: string | null;
  retail_value?: number | null;
  sponsor_name?: string | null;
};

type Profile = {
  id: string;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role?: string | null;
  spins_remaining?: number | null;
  total_spins?: number | null;
  created_at?: string | null;
};

type Win = {
  id: string | number;
  user_id?: string | null;
  prize?: string | null;
  prize_id?: string | number | null;
  created_at: string;
  fulfilled?: boolean | null;
};

const navItems: Array<{
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "prizes", label: "Prizes", icon: Gift },
  { id: "users", label: "Users", icon: Users },
  { id: "winners", label: "Winners", icon: Trophy },
  { id: "settings", label: "Settings", icon: Settings },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fullName(profile?: Profile) {
  if (!profile) return "Unknown user";
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return name || profile.email || "Unnamed user";
}

export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>("overview");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadAdminData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(silent);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || currentProfile?.role !== "admin") {
      setAuthorized(false);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setAuthorized(true);

    const [prizesResult, profilesResult, winsResult] = await Promise.all([
      supabase.from("prizes").select("*").order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("wins").select("*").order("created_at", { ascending: false }),
    ]);

    if (prizesResult.error || profilesResult.error || winsResult.error) {
      setError(
        prizesResult.error?.message ||
          profilesResult.error?.message ||
          winsResult.error?.message ||
          "Some admin data could not be loaded."
      );
    }

    setPrizes((prizesResult.data as Prize[]) || []);
    setProfiles((profilesResult.data as Profile[]) || []);
    setWins((winsResult.data as Win[]) || []);
    setLoading(false);
    setRefreshing(false);
  }, [router]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const stats = useMemo(() => {
    const remainingInventory = prizes.reduce(
      (sum, prize) => sum + Math.max(Number(prize.quantity || 0), 0),
      0
    );
    const remainingSpins = profiles.reduce(
      (sum, profile) => sum + Math.max(Number(profile.spins_remaining || 0), 0),
      0
    );

    return {
      users: profiles.filter((profile) => profile.role !== "admin").length,
      activePrizes: prizes.filter((prize) => prize.active !== false).length,
      inventory: remainingInventory,
      wins: wins.length,
      remainingSpins,
    };
  }, [prizes, profiles, wins]);

  const filteredPrizes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return prizes;
    return prizes.filter((prize) =>
      [prize.name, prize.sponsor_name].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [prizes, search]);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter((profile) =>
      [
        profile.email,
        profile.first_name,
        profile.last_name,
        profile.phone,
        profile.role,
      ].some((value) => value?.toLowerCase().includes(query))
    );
  }, [profiles, search]);

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles]
  );

  async function togglePrize(prize: Prize) {
    const nextActive = prize.active === false;
    const { error: updateError } = await supabase
      .from("prizes")
      .update({ active: nextActive })
      .eq("id", prize.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPrizes((current) =>
      current.map((item) =>
        item.id === prize.id ? { ...item, active: nextActive } : item
      )
    );
  }

  async function deletePrize(prize: Prize) {
    const confirmed = window.confirm(
      `Delete “${prize.name}”? This cannot be undone.`
    );
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("prizes")
      .delete()
      .eq("id", prize.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setPrizes((current) => current.filter((item) => item.id !== prize.id));
  }

  async function updateUserRole(profile: Profile, role: "user" | "admin") {
    const confirmed = window.confirm(
      `Change ${fullName(profile)} to ${role === "admin" ? "an admin" : "a user"}?`
    );
    if (!confirmed) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProfiles((current) =>
      current.map((item) => (item.id === profile.id ? { ...item, role } : item))
    );
  }

  if (loading || authorized === null) {
    return (
      <main className="min-h-screen cy-page flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-lg text-[#12304a]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading admin suite...
        </div>
      </main>
    );
  }

  if (authorized === false) {
    return (
      <main className="min-h-screen cy-page flex items-center justify-center px-6">
        <div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
          <ShieldCheck className="mx-auto h-14 w-14 text-[#0f8db3]" />
          <h1 className="mt-5 text-3xl font-black text-[#12304a]">Admin access required</h1>
          <p className="mt-3 text-slate-600">
            Your account does not have permission to open the Spin4Chinuch admin suite.
          </p>
          <Link
            href="/dashboard"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0f8db3] px-6 py-3 font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f8fa] pt-20 text-[#12304a]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-5 py-8 lg:block">
          <div className="px-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#0f8db3] to-[#12304a] text-white shadow-lg">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0f8db3]">Spin4Chinuch</p>
                <h1 className="text-xl font-black">Admin Suite</h1>
              </div>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSection(item.id);
                    setSearch("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${
                    active
                      ? "bg-[#e6f6f8] text-[#0f8db3]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-[#12304a]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {active && <ChevronRight className="ml-auto h-4 w-4" />}
                </button>
              );
            })}
          </nav>

          <div className="mt-10 rounded-3xl bg-[#12304a] p-5 text-white">
            <Sparkles className="h-6 w-6 text-[#d6a84f]" />
            <p className="mt-3 font-black">Campaign control</p>
            <p className="mt-1 text-sm text-slate-300">
              Review inventory and winner activity before changing campaign settings.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="mt-6 flex items-center gap-2 px-4 py-3 font-bold text-slate-500 hover:text-[#12304a]"
          >
            <ArrowLeft className="h-4 w-4" /> User dashboard
          </Link>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-7 md:px-8 lg:px-10">
          <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f8db3]">
                Campaign operations
              </p>
              <h2 className="mt-1 text-3xl font-black md:text-4xl">
                {navItems.find((item) => item.id === section)?.label}
              </h2>
              <p className="mt-2 text-slate-500">
                Manage the fundraiser from one secure workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(section === "prizes" || section === "users") && (
                <label className="flex min-w-[250px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`Search ${section}...`}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </label>
              )}
              <button
                onClick={() => void loadAdminData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold shadow-sm hover:border-[#0f8db3] disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link
                href="/admin/new-prize"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0f8db3] px-5 py-3 font-bold text-white shadow-lg hover:bg-[#12304a]"
              >
                <Gift className="h-4 w-4" /> Add prize
              </Link>
            </div>
          </header>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                    section === item.id
                      ? "bg-[#12304a] text-white"
                      : "bg-white text-slate-500"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Some data could not be updated</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {section === "overview" && (
            <div className="space-y-7">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard icon={Users} label="Registered users" value={stats.users} />
                <StatCard icon={Gift} label="Active prizes" value={stats.activePrizes} />
                <StatCard icon={PackageCheck} label="Prize inventory" value={stats.inventory} />
                <StatCard icon={Trophy} label="Total winners" value={stats.wins} />
                <StatCard icon={Ticket} label="Unused spins" value={stats.remainingSpins} />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <Panel title="Recent winners" subtitle="Latest prize results across the campaign">
                  <div className="divide-y divide-slate-100">
                    {wins.slice(0, 6).map((win) => {
                      const profile = win.user_id ? profileMap.get(win.user_id) : undefined;
                      return (
                        <div key={win.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                            <Trophy className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold">{win.prize || "Prize awarded"}</p>
                            <p className="truncate text-sm text-slate-500">{fullName(profile)}</p>
                          </div>
                          <p className="text-sm text-slate-400">{formatDate(win.created_at)}</p>
                        </div>
                      );
                    })}
                    {wins.length === 0 && <EmptyState text="No winners have been recorded yet." />}
                  </div>
                </Panel>

                <Panel title="Campaign health" subtitle="Items that need an admin’s attention">
                  <div className="space-y-3">
                    <HealthRow
                      good={prizes.some((prize) => prize.active !== false)}
                      label="Active prize pool"
                      detail={`${stats.activePrizes} prizes currently enabled`}
                    />
                    <HealthRow
                      good={prizes.every((prize) => Number(prize.quantity || 0) > 0 || prize.active === false)}
                      label="Inventory coverage"
                      detail={`${prizes.filter((prize) => prize.active !== false && Number(prize.quantity || 0) <= 0).length} active prizes out of stock`}
                    />
                    <HealthRow
                      good={wins.length > 0}
                      label="Winner tracking"
                      detail={`${wins.length} results recorded`}
                    />
                  </div>
                </Panel>
              </div>

              <Panel title="Quick actions" subtitle="Common campaign management tasks">
                <div className="grid gap-4 md:grid-cols-3">
                  <QuickAction
                    icon={Gift}
                    title="Manage prizes"
                    description="Review quantities, odds, and active status."
                    onClick={() => setSection("prizes")}
                  />
                  <QuickAction
                    icon={UserCog}
                    title="Review users"
                    description="Find accounts, roles, and remaining spins."
                    onClick={() => setSection("users")}
                  />
                  <QuickAction
                    icon={Trophy}
                    title="View winners"
                    description="Track results and fulfillment activity."
                    onClick={() => setSection("winners")}
                  />
                </div>
              </Panel>
            </div>
          )}

          {section === "prizes" && (
            <Panel title="Prize inventory" subtitle={`${filteredPrizes.length} prizes shown`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-4 font-bold">Prize</th>
                      <th className="pb-4 font-bold">Sponsor</th>
                      <th className="pb-4 font-bold">Inventory</th>
                      <th className="pb-4 font-bold">Probability</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPrizes.map((prize) => (
                      <tr key={prize.id} className="group">
                        <td className="py-4 pr-4">
                          <p className="font-black text-[#12304a]">{prize.name}</p>
                          <p className="text-sm text-slate-400">Added {formatDate(prize.created_at)}</p>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{prize.sponsor_name || "—"}</td>
                        <td className="py-4 pr-4">
                          <span className={`font-black ${Number(prize.quantity || 0) <= 0 ? "text-red-600" : "text-[#12304a]"}`}>
                            {Number(prize.quantity || 0)}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{prize.probability ?? "—"}</td>
                        <td className="py-4 pr-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            prize.active === false
                              ? "bg-slate-100 text-slate-500"
                              : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {prize.active === false ? "Disabled" : "Active"}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => void togglePrize(prize)}
                              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-[#0f8db3] hover:text-[#0f8db3]"
                              aria-label={prize.active === false ? "Enable prize" : "Disable prize"}
                            >
                              {prize.active === false ? <ToggleLeft className="h-5 w-5" /> : <ToggleRight className="h-5 w-5" />}
                            </button>
                            <Link
                              href={`/admin/edit/${prize.id}`}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-[#12304a] hover:border-[#0f8db3]"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => void deletePrize(prize)}
                              className="rounded-xl border border-red-100 p-2 text-red-500 hover:bg-red-50"
                              aria-label="Delete prize"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPrizes.length === 0 && <EmptyState text="No prizes match your search." />}
              </div>
            </Panel>
          )}

          {section === "users" && (
            <Panel title="User accounts" subtitle={`${filteredProfiles.length} accounts shown`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-4 font-bold">User</th>
                      <th className="pb-4 font-bold">Phone</th>
                      <th className="pb-4 font-bold">Spins remaining</th>
                      <th className="pb-4 font-bold">Total spins</th>
                      <th className="pb-4 font-bold">Role</th>
                      <th className="pb-4 text-right font-bold">Role action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProfiles.map((profile) => (
                      <tr key={profile.id}>
                        <td className="py-4 pr-4">
                          <p className="font-black">{fullName(profile)}</p>
                          <p className="text-sm text-slate-400">{profile.email || "No email"}</p>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{profile.phone || "—"}</td>
                        <td className="py-4 pr-4 font-bold">{profile.spins_remaining ?? 0}</td>
                        <td className="py-4 pr-4 text-slate-600">{profile.total_spins ?? "—"}</td>
                        <td className="py-4 pr-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            profile.role === "admin"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {profile.role || "user"}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() =>
                              void updateUserRole(
                                profile,
                                profile.role === "admin" ? "user" : "admin"
                              )
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:border-[#0f8db3] hover:text-[#0f8db3]"
                          >
                            {profile.role === "admin" ? "Remove admin" : "Make admin"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProfiles.length === 0 && <EmptyState text="No users match your search." />}
              </div>
            </Panel>
          )}

          {section === "winners" && (
            <Panel title="Winner history" subtitle={`${wins.length} recorded results`}>
              <div className="grid gap-4">
                {wins.map((win) => {
                  const profile = win.user_id ? profileMap.get(win.user_id) : undefined;
                  return (
                    <div
                      key={win.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 md:flex-row md:items-center"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black">{win.prize || `Prize #${win.prize_id || "—"}`}</p>
                        <p className="truncate text-sm text-slate-500">
                          {fullName(profile)} {profile?.email ? `• ${profile.email}` : ""}
                        </p>
                      </div>
                      <div className="md:text-right">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          win.fulfilled
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {win.fulfilled ? "Fulfilled" : "Needs follow-up"}
                        </span>
                        <p className="mt-1 text-sm text-slate-400">{formatDate(win.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                {wins.length === 0 && <EmptyState text="No winners have been recorded yet." />}
              </div>
            </Panel>
          )}

          {section === "settings" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Campaign settings" subtitle="Configuration controls for the live fundraiser">
                <div className="space-y-4">
                  <SettingRow icon={CircleDollarSign} title="Spin price" value="$18 per spin" />
                  <SettingRow icon={Gift} title="Prize engine" value={`${stats.activePrizes} active prizes`} />
                  <SettingRow icon={ShieldCheck} title="Admin access" value={`${profiles.filter((profile) => profile.role === "admin").length} administrators`} />
                </div>
                <div className="mt-6 rounded-2xl border border-dashed border-[#0f8db3]/30 bg-[#eaf8fa] p-4 text-sm text-slate-600">
                  Campaign-wide values should be moved into a dedicated Supabase settings table before they are editable here. This prevents important settings from being hard-coded in multiple pages.
                </div>
              </Panel>

              <Panel title="Recommended next modules" subtitle="The next operational tools to connect">
                <div className="space-y-3">
                  <RoadmapItem icon={CircleDollarSign} title="Stripe orders and refunds" />
                  <RoadmapItem icon={PackageCheck} title="Winner fulfillment and tracking" />
                  <RoadmapItem icon={BarChart3} title="Revenue and conversion reports" />
                  <RoadmapItem icon={ShieldCheck} title="Admin audit log" />
                </div>
              </Panel>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-[#12304a]">{value.toLocaleString()}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e6f6f8] text-[#0f8db3]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-6">
        <h3 className="text-xl font-black">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function HealthRow({ good, label, detail }: { good: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
      {good ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      ) : (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      )}
      <div>
        <p className="font-bold">{label}</p>
        <p className="text-sm text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Gift;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#0f8db3] hover:shadow-md"
    >
      <Icon className="h-6 w-6 text-[#0f8db3]" />
      <p className="mt-4 font-black">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <ChevronRight className="mt-4 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#0f8db3]" />
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-slate-400">
      <Gift className="mx-auto mb-3 h-8 w-8" />
      <p>{text}</p>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Settings;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#0f8db3] shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-slate-500">{value}</p>
      </div>
    </div>
  );
}

function RoadmapItem({ icon: Icon, title }: { icon: typeof Settings; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4">
      <Icon className="h-5 w-5 text-[#0f8db3]" />
      <p className="font-bold">{title}</p>
      <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
    </div>
  );
}
