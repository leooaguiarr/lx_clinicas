import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/** Client do browser. Respeita RLS com a sessão do usuário logado. */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
