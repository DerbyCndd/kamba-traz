import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Envia um ficheiro para o armazenamento, com uma segunda tentativa (falhas de rede são pontuais).
 * Se falhar, regista o motivo técnico no Sentry (só o texto do erro, sem o caminho nem dados de pessoas)
 * e devolve um motivo curto para mostrar no ecrã, para se perceber a causa logo ao primeiro erro.
 */
export async function uploadFile(
  supabase: SupabaseClient, bucket: string, path: string, bytes: Uint8Array, contentType: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  let last: { message: string; statusCode?: string | number } | null = null;
  for (let i = 0; i < 2; i++) {
    const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
    if (!error) return { ok: true };
    last = error as { message: string; statusCode?: string | number };
    await new Promise((r) => setTimeout(r, 400));
  }
  const reason = `${last?.statusCode ? last.statusCode + ": " : ""}${last?.message ?? "erro desconhecido"}`.slice(0, 160);
  console.error(`[storage] envio falhou (${bucket}): ${reason}`);
  Sentry.captureMessage(`Envio para o armazenamento falhou (${bucket}): ${reason}`, "error");
  return { ok: false, reason };
}
