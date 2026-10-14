"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    async function getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) throw error;
        setUser(session?.user ?? null);
        setConnectionError(false);
      } catch {
        if (active) setConnectionError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        if (session || event === "SIGNED_OUT") setConnectionError(false);
      }
    );

    function reconnect() { void getSession(); }
    window.addEventListener("online", reconnect);
    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("online", reconnect);
    };
  }, [retry]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
      }}
    >
      {connectionError ? (
        <div role="alert" className="mx-auto my-12 max-w-lg rounded-2xl bg-white p-6 text-center text-slate-700 shadow-lg">
          <p>We couldn&apos;t connect to check your login. Check your connection and try again.</p>
          <button type="button" onClick={() => {
            setLoading(true);
            setRetry((value) => value + 1);
          }} disabled={loading} className="mt-4 rounded-full bg-[#0D2C6C] px-6 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Reconnecting..." : "Try again"}
          </button>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
