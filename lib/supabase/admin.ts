import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

/**
 * Cliente Supabase com service role key — bypassa RLS.
 * Use APENAS em Server Actions e Server Components (nunca expor ao cliente).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
