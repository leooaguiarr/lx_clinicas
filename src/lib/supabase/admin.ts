import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client com service_role: IGNORA RLS.
 *
 * Use apenas em Route Handlers de integração (n8n, Chatwoot, agente de IA),
 * sempre filtrando clinic_id manualmente. Nunca em código que chegue ao browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
