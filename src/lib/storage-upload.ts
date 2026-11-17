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

export const IMG_MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

/** Confirma pelo conteúdo (não pelo nome nem pelo tipo declarado) que o ficheiro é mesmo uma imagem aceite. */
export function imageKind(b: Uint8Array): keyof typeof IMG_MIME | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
}
