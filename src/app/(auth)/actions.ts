"use server";
import { headers } from "next/headers";
import { LEGAL_VERSION } from "@/lib/constants";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clientIp, isLimited, recordHit, TOO_MANY } from "@/lib/ratelimit";

const MIN = 60;

export type AuthState = { error?: string; message?: string; email?: string; needsConfirm?: boolean };

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return h.get("origin") ?? "http://localhost:3000";
}

const NEXT: Record<string, string> = { pedir: "/pedir", viajar: "/viajar" };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!validEmail(email) || !password) return { error: "Indica o email e a palavra-passe.", email };

  const ip = await clientIp();
  if ((await isLimited("login-ip", ip, 10, 5 * MIN)) || (await isLimited("login-email", email, 5, 15 * MIN))) return { error: TOO_MANY, email };
  await recordHit("login-ip", ip);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    await recordHit("login-email", email);
    if (/not confirmed/i.test(error.message)) {
      return { error: "Ainda não confirmaste o teu email. Abre a mensagem que te enviámos e clica no link.", email, needsConfirm: true };
    }
    return { error: "Email ou palavra-passe incorrectos.", email };
  }
  redirect(NEXT[str(fd, "para")] ?? "/");
}

export async function signup(_: AuthState, fd: FormData): Promise<AuthState> {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const again = String(fd.get("again") ?? "");
  if (name.length < 2 || name.length > 60) return { error: "Escreve o teu nome completo.", email };
  if (!validEmail(email)) return { error: "Indica um email válido.", email };
  if (password.length < 8) return { error: "A palavra-passe precisa de pelo menos 8 caracteres.", email };
  if (password !== again) return { error: "As palavras-passe não coincidem.", email };
  if (str(fd, "accept") !== "on") return { error: "Aceita os termos de uso e a política de privacidade para criar conta.", email };

  const ip = await clientIp();
  if (await isLimited("signup-ip", ip, 5, 15 * MIN)) return { error: TOO_MANY, email };
  await recordHit("signup-ip", ip);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, terms_version: LEGAL_VERSION, privacy_version: LEGAL_VERSION }, emailRedirectTo: (await siteUrl()) + "/auth/callback" + (NEXT[str(fd, "para")] ? "?next=" + NEXT[str(fd, "para")] : "") },
  });
  if (error) {
    if (/rate|too many|seconds/i.test(error.message)) return { error: "Demasiadas tentativas. Espera um minuto e tenta de novo.", email };
    return { error: "Não foi possível criar a conta: " + error.message, email };
  }
  // Mesma resposta quer o email já exista, quer não (não revela quem tem conta).
  redirect("/registo/verificar?email=" + encodeURIComponent(email));
}

export async function resendConfirmation(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, "email").toLowerCase();
  if (!validEmail(email)) return { error: "Email inválido." };
  const ip = await clientIp();
  if ((await isLimited("mail-ip", ip, 5, 15 * MIN)) || (await isLimited("mail-email", email, 3, 15 * MIN))) return { error: TOO_MANY, email };
  await recordHit("mail-ip", ip);
  await recordHit("mail-email", email);
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: (await siteUrl()) + "/auth/callback" },
  });
  if (error) return { error: "Não foi possível reenviar agora. Espera um minuto e tenta de novo.", email };
  return { message: "Enviámos de novo o email de confirmação. Verifica também a pasta de spam.", email };
}

export async function requestReset(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, "email").toLowerCase();
  if (!validEmail(email)) return { error: "Indica um email válido.", email };
  const ip = await clientIp();
  if ((await isLimited("mail-ip", ip, 5, 15 * MIN)) || (await isLimited("mail-email", email, 3, 15 * MIN))) return { error: TOO_MANY, email };
  await recordHit("mail-ip", ip);
  await recordHit("mail-email", email);
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: (await siteUrl()) + "/auth/callback?next=/nova-palavra-passe",
  });
  return { message: "Se existir uma conta com esse email, enviámos um link para escolheres uma nova palavra-passe.", email };
}

export async function updatePassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const password = String(fd.get("password") ?? "");
  const again = String(fd.get("again") ?? "");
  if (password.length < 8) return { error: "A palavra-passe precisa de pelo menos 8 caracteres." };
  if (password !== again) return { error: "As palavras-passe não coincidem." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível guardar: " + error.message };
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
