"use server";
import { getUser } from "@/lib/auth";
import { clientIp, isLimited, recordHit, TOO_MANY } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";

export type FeedbackState = { error?: string; done?: boolean };

const KINDS = ["elogio", "ideia", "problema", "outro"];
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;

/** Recebe o feedback de qualquer pessoa. Limita por IP e ignora robôs (campo-armadilha escondido). */
export async function submitFeedback(_: FeedbackState, fd: FormData): Promise<FeedbackState> {
  if (String(fd.get("website") ?? "").trim()) return { done: true }; // só um robô preenche isto: finge que correu bem

  const kind = String(fd.get("kind") ?? "");
  const rating = parseInt(String(fd.get("rating") ?? ""), 10);
  const message = String(fd.get("message") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const rawPage = String(fd.get("page") ?? "");
  const page = /^\/[A-Za-z0-9/_-]{0,80}$/.test(rawPage) ? rawPage : "";

  if (!KINDS.includes(kind)) return { error: "Escolhe o tipo de feedback." };
  if (message.length < 5) return { error: "Escreve pelo menos uma frase." };
  if (message.length > 1000) return { error: "A mensagem pode ter até 1000 caracteres." };
  if (email && !validEmail(email)) return { error: "O email não parece válido. Podes deixá-lo em branco." };

  const ip = await clientIp();
  if (await isLimited("fb-ip", ip, 5, 3600)) return { error: TOO_MANY };

  const [supabase, user] = await Promise.all([createClient(), getUser()]);
  const row = { user_id: user?.id ?? null, kind, rating: rating >= 1 && rating <= 5 ? rating : null, message, email: email || null, page };
  // Grava por uma função que exige o segredo do servidor: quem usar a API pública diretamente já não consegue inundar a tabela.
  // Enquanto o SQL da auditoria não correr (função em falta), usa a gravação antiga.
  let { error } = await supabase.rpc("submit_feedback", {
    p_secret: process.env.RATE_LIMIT_SECRET ?? "", p_user: row.user_id, p_kind: kind, p_rating: row.rating, p_message: message, p_email: email, p_page: page,
  });
  if (error && error.code === "PGRST202") ({ error } = await supabase.from("feedback").insert(row));
  if (error) return { error: "Não foi possível enviar agora. Tenta de novo daqui a pouco." };
  await recordHit("fb-ip", ip);
  return { done: true };
}
