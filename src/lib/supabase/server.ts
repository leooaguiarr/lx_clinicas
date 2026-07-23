import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client para Server Components, Server Actions e Route Handlers.
 * Respeita RLS com a sessão do usuário logado.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem escrever cookies. A renovação da sessão
          // acontece no middleware, então ignorar aqui é seguro.
        }
      },
    },
  });
}
