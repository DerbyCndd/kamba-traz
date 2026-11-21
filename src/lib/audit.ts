import "server-only";
import type { createClient } from "./supabase/server";

type Supa = Awaited<ReturnType<typeof createClient>>;

/** O que cada ação do registo quer dizer, para o dono ler. */
export const ACCESS_LABEL: Record<string, string> = {
  bi_numero: "Abriu o número do BI",
  passaporte_numero: "Abriu o número do passaporte",
  foto_id: "Abriu uma foto de identificação",
  morada_familia: "Abriu a morada e os familiares",
  passaporte_viagem: "Abriu o passaporte de uma viagem",
  bilhete: "Abriu o bilhete de avião",
  fatura: "Abriu uma fatura",
};

/**
 * Guarda no registo permanente que alguém da equipa abriu um documento: quem, o quê, sobre quem e quando.
 * Devolve uma mensagem de erro se não conseguiu registar (nesse caso o documento NÃO deve ser mostrado),
 * ou null se registou. Se supabase/seguranca-equipa.sql ainda não foi corrido, a função não existe e segue sem registar.
 */
export async function logAccess(supabase: Supa, action: string, subjectId: string | null, detail?: string): Promise<string | null> {
  const { error } = await supabase.rpc("log_access", { p_action: action, p_subject: subjectId, p_detail: detail ?? null });
  if (!error) return null;
  if (error.code === "PGRST202" || error.code === "42883") return null; // o SQL ainda não foi corrido
  console.error("[auditoria] não foi possível registar o acesso:", error.code);
  return "Não foi possível registar o acesso. Tenta de novo daqui a pouco.";
}
