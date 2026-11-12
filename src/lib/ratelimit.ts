import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "./supabase/server";

// O Supabase só vê o IP do nosso servidor, por isso limitamos aqui, por IP real e por email.
// Falha aberta: se a base de dados não responder, não bloqueamos toda a gente.

const secret = () => process.env.RATE_LIMIT_SECRET ?? "";
const k = (scope: string, v: string) => scope + ":" + createHmac("sha256", secret()).update(v).digest("hex").slice(0, 32);

/** IP do cliente. Em produção atrás da Vercel ou de outro proxy de confiança, o primeiro valor é o do visitante. */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "desconhecido").trim().slice(0, 64);
}

/** Quantas vezes já aconteceu `scope` para `value` na janela (segundos) é >= max? */
export async function isLimited(scope: string, value: string, max: number, windowSec: number) {
  if (!secret()) return false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("rl_count", { p_secret: secret(), p_key: k(scope, value), p_window: windowSec });
    return !error && typeof data === "number" && data >= max;
  } catch { return false; }
}

export async function recordHit(scope: string, value: string) {
  if (!secret()) return;
  try {
    const supabase = await createClient();
    await supabase.rpc("rl_hit", { p_secret: secret(), p_key: k(scope, value) });
  } catch { /* ignora */ }
}

export const TOO_MANY = "Demasiadas tentativas. Espera alguns minutos e tenta de novo.";
