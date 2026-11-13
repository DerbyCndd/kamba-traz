import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Os links dos emails (confirmação de conta e recuperação de palavra-passe) chegam aqui.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/"; // evita redireccionar para sites externos

  const supabase = await createClient();
  let error: unknown = new Error("link inválido");

  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
    if (!error && type === "recovery") next = "/nova-palavra-passe";
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  }

  if (error) return NextResponse.redirect(`${origin}/login?erro=link`);
  // Conta nova: a identificação (BI + telefone) pede-se logo a seguir, uma só vez.
  if (next === "/" || next === "/pedir" || next === "/viajar") return NextResponse.redirect(`${origin}/identificacao?next=${encodeURIComponent(next)}`);
  return NextResponse.redirect(`${origin}${next}`);
}
