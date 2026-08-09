import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/*
 * `/redefinir-senha` é pública de propósito: quem chega com o link vencido não
 * tem sessão, e mandar essa pessoa para o login esconderia o motivo. A própria
 * página exige a sessão criada por `/auth/confirmar` antes de mostrar o
 * formulário.
 */
const PUBLIC_ROUTES = ["/login", "/esqueci-minha-senha", "/redefinir-senha", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Renova o token de sessão a cada request e bloqueia rotas do dashboard para
 * quem não está autenticado.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() revalida o token no servidor — não use getSession() aqui.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && pathname === "/login") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/agenda";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
