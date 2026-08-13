"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Shield, UserCheck, UserRoundCog, UserX, Users } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/ui/StatCard";

type ManagedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  role: "admin" | "user";
  remainingSpins: number;
  totalSpins: number;
  active: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  isCurrentAdmin: boolean;
};

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");
  return { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [query, setQuery] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { headers: await authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load users.");
      setUsers(data.users);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  async function updateUser(userId: string, changes: Record<string, unknown>, successMessage: string) {
    setSavingId(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ userId, ...changes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update user.");
      toast.success(successMessage);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user.");
    } finally {
      setSavingId("");
    }
  }

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => `${user.firstName} ${user.lastName} ${user.email} ${user.city} ${user.state}`.toLowerCase().includes(needle));
  }, [query, users]);

  return (
    <main className="app-page">
      <div className="app-container">
        <section className="page-hero">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4267A8]">Administration</p>
              <h1 className="mt-1 text-4xl font-black">Users</h1>
              <p className="mt-2 text-slate-500">Manage access, roles, and available spin balances.</p>
            </div>
            <Link href="/admin" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center font-bold shadow-sm">Back to Admin</Link>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Users" value={users.length} icon={<Users />} />
          <StatCard label="Administrators" value={users.filter((user) => user.role === "admin").length} icon={<Shield />} />
          <StatCard label="Active Accounts" value={users.filter((user) => user.active).length} icon={<UserCheck />} />
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg">
          <label htmlFor="user-search" className="sr-only">Search users</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input id="user-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, or location" className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 outline-none focus:border-[#2F6ED8] focus:ring-4 focus:ring-blue-100" />
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
          {loading ? (
            <div className="py-16 text-center text-slate-500">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-500">No users match your search.</div>
          ) : filteredUsers.map((user) => (
            <article key={user.id} className="grid gap-5 border-b border-slate-100 p-5 last:border-0 xl:grid-cols-[minmax(240px,1.5fr)_170px_190px_180px] xl:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-bold">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed user"}</h2>
                  {!user.active && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Deactivated</span>}
                  {user.isCurrentAdmin && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">You</span>}
                </div>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
                <p className="mt-1 text-xs text-slate-400">{[user.city, user.state].filter(Boolean).join(", ") || "No location"} · Joined {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>

              <div>
                <label htmlFor={`role-${user.id}`} className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Role</label>
                <select id={`role-${user.id}`} value={user.role} disabled={savingId === user.id || user.isCurrentAdmin} onChange={(event) => void updateUser(user.id, { role: event.target.value }, "Role updated.")} className="w-full rounded-xl border border-slate-200 px-3 py-2 disabled:bg-slate-100">
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <form onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void updateUser(user.id, { remainingSpins: Number(form.get("remainingSpins")) }, "Spin balance updated.");
              }}>
                <label htmlFor={`spins-${user.id}`} className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Spins Remaining</label>
                <div className="flex gap-2">
                  <input id={`spins-${user.id}`} name="remainingSpins" type="number" min={0} max={100000} step={1} defaultValue={user.remainingSpins} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2" />
                  <button disabled={savingId === user.id} className="rounded-xl bg-[#2F6ED8] px-3 py-2 font-bold text-white disabled:opacity-50">Save</button>
                </div>
                <p className="mt-1 text-xs text-slate-400">{user.totalSpins} purchased total</p>
              </form>

              <button disabled={savingId === user.id || user.isCurrentAdmin} onClick={() => {
                const action = user.active ? "deactivate" : "reactivate";
                if (window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${user.email}?`)) {
                  void updateUser(user.id, { active: !user.active }, `Account ${action}d.`);
                }
              }} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40 ${user.active ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {user.active ? <UserX size={18} /> : <UserRoundCog size={18} />}
                {user.active ? "Deactivate" : "Reactivate"}
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
