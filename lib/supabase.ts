import { createClient } from "@supabase/supabase-js";
import { authFetch } from "./auth-fetch";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { fetch: authFetch } }
);

// Register immediately, before URL-session initialization can emit recovery.
// Supabase may fall back to the site URL when redirectTo is not allowlisted.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/reset-password") {
      // The recovery session is saved before this event; it survives navigation.
      window.location.replace("/reset-password");
    }
  });
}
