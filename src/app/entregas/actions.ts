"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { uploadFile } from "@/lib/storage-upload";
import { isLimited, recordHit, TOO_MANY } from "@/lib/ratelimit";
import { randomInt } from "node:crypto";
import { notifyDeal } from "@/lib/notify";

export type DeliveryState = { error?: string; done?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Os erros que escrevemos na base de dados são seguros de mostrar; os outros ficam genéricos.
const safe = (e: { code?: string; message: string }) =>
  ["P0001", "42501", "22023"].includes(e.code ?? "") ? e.message : "Não foi possível agora. Tenta de novo daqui a pouco.";

/** O entregador pega a encomenda: a entrega passa a "em trânsito" e começa a partilha de localização (com o consentimento dele). */
export async function pickupDeal(dealId: string): Promise<DeliveryState> {
  const { supabase } = await requireUser();
  if (!UUID.test(dealId)) return { error: "Entrega inválida." };
  const { error } = await supabase.rpc("pickup_deal", { p_deal: dealId });
  if (error) return { error: safe(error) };
  await notifyDeal(dealId);
  revalidatePath(`/entregas/${dealId}`);
  revalidatePath("/entregas");
  return { done: true };
}

/** O entregador parte com a encomenda: recolhido → em viagem (começa a partilha de localização). */
export async function startTripDeal(dealId: string): Promise<DeliveryState> {
  const { supabase } = await requireUser();
  if (!UUID.test(dealId)) return { error: "Entrega inválida." };
  const { error } = await supabase.rpc("start_trip_deal", { p_deal: dealId });
  if (error) return { error: safe(error) };
  await notifyDeal(dealId);
  revalidatePath(`/entregas/${dealId}`);
  revalidatePath("/entregas");
  return { done: true };
}

/**
 * Quem envia gera o código de entrega. É criado aqui, no servidor; a base de dados guarda só o hash (com validade de 30 dias)
 * e o código volta uma única vez para ser mostrado. Gerar outro invalida o anterior.
 */
export async function newDeliveryCode(dealId: string): Promise<{ error?: string; code?: string; expires?: string }> {
  const { user, supabase } = await requireUser();
  if (!UUID.test(dealId)) return { error: "Entrega inválida." };
  if (await isLimited("deal-code-new", user.id, 5, 3600)) return { error: TOO_MANY };
  await recordHit("deal-code-new", user.id);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { data, error } = await supabase.rpc("set_delivery_code", { p_deal: dealId, p_code: code });
  if (error) return { error: error.code === "PGRST202" ? "Falta correr o estados-entrega.sql." : safe(error) };
  revalidatePath(`/entregas/${dealId}`);
  return { code, expires: typeof data === "string" ? data : undefined };
}

/** O entregador introduz o código que quem recebe lhe deu. A verificação é feita na base de dados, com limite de tentativas. */
export async function confirmDelivery(_: DeliveryState, fd: FormData): Promise<DeliveryState> {
  const { user, supabase } = await requireUser();
  const deal = String(fd.get("deal") ?? "");
  const code = String(fd.get("code") ?? "").replace(/\D/g, "");
  if (!UUID.test(deal)) return { error: "Entrega inválida." };
  if (code.length !== 6) return { error: "O código tem 6 dígitos." };
  // Além das 5 tentativas por código na base de dados, um limite por pessoa (também entre entregas).
  if (await isLimited("deal-code-try", user.id, 10, 900)) return { error: TOO_MANY };
  await recordHit("deal-code-try", user.id);

  const { data, error } = await supabase.rpc("confirm_delivery", { p_deal: deal, p_code: code });
  if (error) return { error: safe(error) };
  if (data === "ok") {
    await notifyDeal(deal);
    revalidatePath(`/entregas/${deal}`);
    revalidatePath("/entregas");
    revalidatePath("/carteira");
    return { done: true };
  }
  if (data === "expirado") return { error: "Este código expirou. Pede a quem envia que gere um novo na app." };
  if (data === "bloqueado") return { error: "Demasiadas tentativas erradas. Fala com a equipa." };
  const left = /^errado:(\d+)/.exec(String(data))?.[1];
  return { error: left ? `Código errado. Restam ${left} tentativas.` : "Código errado." };
}

const MAX_PHOTO = 3 * 1024 * 1024;
const MAX_PER_DEAL = 10;
const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
function imageKind(b: Uint8Array): keyof typeof MIME | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
}

/** O entregador envia fotos do estado do volume, antes de pegar a encomenda. As regras de acesso garantem que só ele o faz, e só neste momento. */
export async function uploadDealPhotos(fd: FormData): Promise<DeliveryState & { count?: number }> {
  const { user, supabase } = await requireUser();
  const dealId = String(fd.get("deal") ?? "");
  if (!UUID.test(dealId)) return { error: "Entrega inválida." };
  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Escolhe pelo menos uma foto." };
  if (files.length > 6) return { error: "Envia no máximo 6 fotos de cada vez." };

  const { data: deal } = await supabase.from("deals").select("id, traveler_id, status").eq("id", dealId).maybeSingle();
  if (!deal || deal.traveler_id !== user.id) return { error: "Só o entregador desta entrega pode enviar estas fotos." };
  if (deal.status !== "garantia") return { error: "As fotos enviam-se antes de pegar a encomenda, com o pagamento retido." };

  const { count: have } = await supabase.from("deal_photos").select("id", { count: "exact", head: true }).eq("deal_id", dealId);
  if ((have ?? 0) + files.length > MAX_PER_DEAL) return { error: `Cada entrega aceita no máximo ${MAX_PER_DEAL} fotos.` };
  if (await isLimited("deal-photo-user", user.id, 10, 3600)) return { error: TOO_MANY };
  await recordHit("deal-photo-user", user.id);

  const prepared: { bytes: Uint8Array; kind: keyof typeof MIME }[] = [];
  for (const f of files) {
    if (f.size > MAX_PHOTO) return { error: "Uma das fotos é demasiado grande (máximo 3 MB)." };
    const bytes = new Uint8Array(await f.arrayBuffer());
    const kind = imageKind(bytes);
    if (!kind) return { error: "Usa fotos em JPG, PNG ou WebP." };
    prepared.push({ bytes, kind });
  }

  const paths: string[] = [];
  for (const p of prepared) {
    const path = `${dealId}/${crypto.randomUUID()}.${p.kind}`;
    const up = await uploadFile(supabase, "deal-photos", path, p.bytes, MIME[p.kind]);
    if (!up.ok) { if (paths.length) await supabase.storage.from("deal-photos").remove(paths); return { error: `Não foi possível enviar as fotos agora. Tenta de novo daqui a pouco. (Motivo técnico: ${up.reason})` }; }
    paths.push(path);
  }
  const { error } = await supabase.from("deal_photos").insert(paths.map((path) => ({ deal_id: dealId, user_id: user.id, kind: "recolha", path })));
  if (error) {
    await supabase.storage.from("deal-photos").remove(paths); // não deixa fotos órfãs
    return { error: "Não foi possível guardar as fotos agora. Tenta de novo daqui a pouco." };
  }
  revalidatePath(`/entregas/${dealId}`);
  return { done: true, count: (have ?? 0) + paths.length };
}

const KINDS = ["nao_recebida", "volume_diferente", "item_proibido", "conduta", "outro"];

/** Quem participa numa entrega pode denunciar um problema à equipa. A outra parte não vê a denúncia. */
export async function reportDeal(_: DeliveryState, fd: FormData): Promise<DeliveryState> {
  const { user, supabase } = await requireUser();
  const dealId = String(fd.get("deal") ?? "");
  const kind = String(fd.get("kind") ?? "");
  const message = String(fd.get("message") ?? "").trim();
  if (!UUID.test(dealId)) return { error: "Entrega inválida." };
  if (!KINDS.includes(kind)) return { error: "Escolhe o tipo de problema." };
  if (message.length < 10 || message.length > 600) return { error: "Descreve o problema em 10 a 600 caracteres." };
  if (await isLimited("deal-report-user", user.id, 5, 24 * 3600)) return { error: TOO_MANY };
  await recordHit("deal-report-user", user.id);
  const { error } = await supabase.rpc("report_deal", { p_deal: dealId, p_kind: kind, p_message: message });
  if (error) return { error: safe(error) };
  revalidatePath(`/entregas/${dealId}`);
  return { done: true };
}
