import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Páginas abertas a quem não tem sessão. A página inicial mostra uma apresentação
// (sem dados do quadro) a visitantes e a vista completa a quem tem sessão.
const PUBLIC = ["/login", "/registo", "/recuperar", "/auth", "/regras"];
const isPublic = (p: string) => p === "/" || PUBLIC.some((x) => p === x || p.startsWith(x + "/"));

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Renova a sessão e confirma o utilizador junto do Supabase.
  const { data: { user } } = await supabase.auth.getUser();
  const ok = !!user && !!user.email_confirmed_at; // só emails verificados usam a app
  const path = request.nextUrl.pathname;

  if (!ok && !isPublic(path)) {
    const url = request.nextUrl.clone();
    // Quem quer pedir um envio ou viajar e ainda não tem conta vai direito ao registo.
    const para = path === "/pedir" ? "pedir" : path === "/viajar" ? "viajar" : "";
    url.pathname = para ? "/registo" : "/login";
    url.search = para ? "?para=" + para : "";
    return NextResponse.redirect(url);
  }
  if (ok && (path === "/login" || path === "/registo")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
