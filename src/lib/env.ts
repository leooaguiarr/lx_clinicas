function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Copie .env.example para .env.local e preencha os valores da sua instância Supabase.`,
    );
  }
  return value;
}

/** Variáveis públicas — precisam ser referenciadas literalmente para o Next inliná-las no bundle. */
export const supabaseUrl = () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Server-only. Ignora RLS — nunca importar em componentes de cliente. */
export const supabaseServiceRoleKey = () =>
  required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
