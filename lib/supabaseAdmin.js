import { createClient } from "@supabase/supabase-js";

// Server-only client using the service_role key, which bypasses Row Level
// Security entirely. That's intentional and safe: this module is only ever
// imported from Route Handlers (server code), never from a "use client"
// file, so the key never reaches the browser. Every table has RLS enabled
// with no policy granting the anon/public key any access — this is the
// only way in.
let client = null;

export function supabaseAdmin() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Add them to .env.local."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}
