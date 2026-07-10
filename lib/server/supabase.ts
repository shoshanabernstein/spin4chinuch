import { createClient } from "@supabase/supabase-js";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const url = required("NEXT_PUBLIC_SUPABASE_URL");

export const supabaseAdmin = createClient(
  url,
  required("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const supabaseAuth = createClient(
  url,
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function getRequestUser(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length);
  const { data, error } = await supabaseAuth.auth.getUser(token);
  return error ? null : data.user;
}
