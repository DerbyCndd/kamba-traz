import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Páginas que exigem sessão. Quem não a tem vai para o login (ou para o registo, ao tentar pedir ou viajar).
// Qualquer outro endereço segue em frente: se a página existe e é pública abre, e se não existe mostra «não encontrada».
// As próprias páginas privadas voltam a verificar a sessão no servidor.
const PRIVATE = ["/quadro", "/pedir", "/viajar", "/perfil", "/entregas", "/propostas", "/admin", "/identificacao", "/carteira", "/meus", "/seguranca", "/nova-palavra-passe"];
const isPrivate = (p: string) => PRIVATE.some((x) => p === x || p.startsWith(x + "/"));

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

  if (!ok && isPrivate(path)) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
