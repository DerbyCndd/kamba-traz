"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { CATS, DEAL_STEPS, REQ_STATES, TRIP_STATES } from "@/lib/constants";
import { firstName } from "@/lib/format";
import { CUSTOMS } from "@/lib/customs";
import { randomInt } from "node:crypto";
import { decryptPii, encryptPii, piiReady } from "@/lib/pii";

export type AdminState = { error?: string; message?: string };

type Kind = "trip" | "request";
const TABLE = (k: Kind) => (k === "trip" ? "trips" : "requests");
const done = () => revalidatePath("/", "layout");

/** Uma viagem só se publica com os documentos do viajante confirmados (as de exemplo ficam de fora). */
async function docsOk(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], tripId: string) {
  const [{ data: d }, { data: t }] = await Promise.all([
    supabase.from("traveler_docs").select("status").eq("trip_id", tripId).maybeSingle(),
    supabase.from("trips").select("example").eq("id", tripId).maybeSingle(),
  ]);
  if (t?.example === true) return true;
  const { data: trip } = await supabase.from("trips").select("user_id").eq("id", tripId).maybeSingle();
  const ident = trip ? await supabase.from("identities").select("status").eq("user_id", trip.user_id).maybeSingle() : null;
  if (ident?.data && ident.data.status !== "confirmado") return false; // identificação por confirmar
  // Documentos fora de validade não se aprovam (colunas só existem depois de identity-dates.sql).
  const dates = trip ? await supabase.from("identities").select("bi_expiry, passport_expiry").eq("user_id", trip.user_id).maybeSingle() : null;
  const day = new Date().toISOString().slice(0, 10);
  if (dates?.data && ((dates.data.bi_expiry && dates.data.bi_expiry <= day) || (dates.data.passport_expiry && dates.data.passport_expiry <= day))) return false;
  return d?.status === "confirmado";
}

export async function approveItem(kind: Kind, id: string) {
  const { supabase } = await requireAdmin();
  if (kind === "trip" && !(await docsOk(supabase, id))) return; // sem documentos confirmados não se aprova
  await supabase.from(TABLE(kind)).update({ status: "aberto" }).eq("id", id).eq("status", "pendente");
  done();
}

export async function rejectItem(kind: Kind, id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from(TABLE(kind)).update({ status: "recusado" }).eq("id", id).eq("status", "pendente");
  done();
}

export async function setItemStatus(kind: Kind, id: string, status: string) {
  const { supabase } = await requireAdmin();
  const allowed = (kind === "trip" ? TRIP_STATES : REQ_STATES).map((s) => s[0]);
  if (!allowed.includes(status)) return;
  if (kind === "trip" && status === "aberto" && !(await docsOk(supabase, id))) return;
  await supabase.from(TABLE(kind)).update({ status }).eq("id", id);
  done();
}

export async function deleteItem(kind: Kind, id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from(TABLE(kind)).delete().eq("id", id);
  done();
}

export async function createDeal(_: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const requestId = String(fd.get("request") ?? "");
  const tripId = String(fd.get("trip") ?? "");
  const price = Math.round(parseFloat(String(fd.get("price") ?? "")));
  if (!requestId || !tripId || !(price > 0)) return { error: "Escolhe um pedido, uma viagem e o valor acordado." };

  const [{ data: r }, { data: t }, { data: c }] = await Promise.all([
    supabase.from("requests").select("id, user_id, item, origin, destination, name, status, item_value").eq("id", requestId).maybeSingle(),
    supabase.from("trips").select("id, user_id, name, status").eq("id", tripId).maybeSingle(),
    supabase.from("config").select("commission").eq("id", 1).maybeSingle(),
  ]);
  if (!r || !t) return { error: "Pedido ou viagem não encontrados." };
  if (r.status !== "aberto") return { error: "Esse pedido já não está aberto." };
  if (r.user_id === t.user_id) return { error: "O pedido e a viagem são da mesma pessoa. Escolhe uma viagem de outra pessoa." };
  if (t.status === "pendente" || t.status === "recusado" || t.status === "concluida") return { error: "Essa viagem ainda não está aprovada (ou já terminou)." };

  // Alfândega: o valor total das mercadorias de uma viagem não passa Kz 1 500 000 (acima é regime geral, com despachante).
  const { data: others } = await supabase.from("deals").select("request_id").eq("trip_id", t.id).neq("status", "cancelado");
  const ids = (others ?? []).map((o: { request_id: string | null }) => o.request_id).filter((x): x is string => !!x);
  const { data: sibl } = ids.length ? await supabase.from("requests").select("item_value").in("id", ids) : { data: [] as { item_value: number }[] };
  const totalEur = (sibl ?? []).reduce((a: number, x: { item_value: number }) => a + Number(x.item_value ?? 0), 0) + Number(r.item_value ?? 0);
  if (Math.round(totalEur * CUSTOMS.eurKz) > CUSTOMS.flatMaxKz) return { error: `O valor total das mercadorias desta viagem (cerca de ${Math.round(totalEur)} €) passa o limite da alfândega de Kz 1 500 000. Escolhe outra viagem.` };

  // Prémio do mês: se o entregador ou o remetente ganhou o mês passado, a comissão é 0. Quem decide é a base de dados.
  const { data: waived } = await supabase.rpc("deal_fee_waived", { p_request: r.id, p_trip: t.id });
  const fee_waived = waived === true;
  const pct = fee_waived ? 0 : Number(c?.commission ?? 12);
  const { error } = await supabase.from("deals").insert({
    request_id: r.id, trip_id: t.id, sender_id: r.user_id, traveler_id: t.user_id, label: `${r.item} · ${r.origin} → ${r.destination}`,
    traveler: firstName(t.name), requester: firstName(r.name), price,
    commission_pct: pct, commission: Math.round((price * pct) / 100), status: "negociacao",
    ...(fee_waived ? { fee_waived: true } : {}),
  });
  if (error) return { error: "Não foi possível criar a entrega." };
  await supabase.from("requests").update({ status: "ligado" }).eq("id", r.id);
  await supabase.from("offers").update({ status: "convertida", responded_at: new Date().toISOString() }).eq("request_id", r.id).eq("trip_id", t.id).eq("status", "aceite"); // o acordo virou entrega
  done();
  return { message: fee_waived ? "Entrega criada, sem comissão (prémio do mês)." : "Entrega criada." };
}

export async function setDealStatus(id: string, status: string) {
  const { supabase } = await requireAdmin();
  if (![...DEAL_STEPS.map((s) => s[0]), "cancelado"].includes(status)) return;
  if (status === "garantia") return; // o pagamento só se confirma pela acção própria (gera o código de entrega)
  await supabase.from("deals").update({ status }).eq("id", id);
  done();
}

export async function deleteDeal(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("deals").delete().eq("id", id);
  done();
}

export async function seedExamples() {
  const { supabase, profile } = await requireAdmin();
  const day = (n: number) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const { data: c } = await supabase.from("config").select("per_kg").eq("id", 1).maybeSingle();
  const base = c?.per_kg ?? 8000;
  const common = { user_id: profile.id, contact: "exemplo", status: "aberto", example: true };
  await supabase.from("trips").insert([
    { ...common, origin: "LIS", destination: "LAD", travel_date: day(9), kg: 15, per_kg: base, name: "Mário" },
    { ...common, origin: "OPO", destination: "LAD", travel_date: day(16), kg: 8, per_kg: Math.round(base * 1.1), name: "Teresa" },
    { ...common, origin: "LIS", destination: "BUG", travel_date: day(23), kg: 12, per_kg: Math.round(base * 0.95), name: "Eduardo" },
  ]);
  await supabase.from("requests").insert([
    { ...common, origin: "LIS", destination: "LAD", item: "Telemóvel novo na caixa", category: CATS[1], kg: 1, offer: 45000, name: "Carla" },
    { ...common, origin: "LIS", destination: "LAD", item: "Peças de carro (filtros e pastilhas)", category: CATS[3], kg: 6, offer: 70000, name: "Joaquim" },
    { ...common, origin: "OPO", destination: "LAD", item: "Roupa e calçado de criança", category: CATS[0], kg: 4, offer: 35000, name: "Ana" },
    { ...common, origin: "FAO", destination: "SDD", item: "Brinquedos para os sobrinhos", category: CATS[5], kg: 0.8, offer: 25000, name: "Domingos" },
  ]);
  done();
}

export async function removeExamples() {
  const { supabase } = await requireAdmin();
  await supabase.from("trips").delete().eq("example", true);
  await supabase.from("requests").delete().eq("example", true);
  done();
}

export async function saveConfig(_: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const commission = Math.min(50, Math.max(0, parseFloat(String(fd.get("commission"))) || 0));
  const per_kg = Math.max(0, Math.round(parseFloat(String(fd.get("per_kg"))) || 0));
  const whatsapp = String(fd.get("whatsapp") ?? "").trim().slice(0, 30);
  const { error } = await supabase.from("config").update({ commission, per_kg, whatsapp }).eq("id", 1);
  if (error) return { error: "Não foi possível guardar." };
  done();
  return { message: "Guardado." };
}

// ---------- documentos do viajante ----------
/** Mostra o número do passaporte (decifrado só aqui, no servidor, e só à equipa). Cada consulta fica no registo. */
export async function revealPassport(tripId: string): Promise<{ value?: string; error?: string }> {
  const { supabase, profile } = await requireAdmin();
  const { data } = await supabase.from("traveler_docs").select("passport_enc").eq("trip_id", tripId).maybeSingle();
  if (!data) return { error: "Esta viagem não tem documentos." };
  if (!data.passport_enc) return { error: "Esta viagem não tem passaporte (a identificação está no cadastro)." };
  const value = decryptPii(data.passport_enc);
  if (!value) return { error: "Não foi possível ler o número (a chave de cifra pode estar em falta)." };
  console.info("[auditoria] passaporte consultado", { equipa: profile.id, viagem: tripId });
  return { value };
}

/** Ligação à foto do bilhete, válida só 2 minutos. A foto nunca é pública. */
export async function ticketUrl(tripId: string): Promise<{ url?: string; error?: string }> {
  const { supabase, profile } = await requireAdmin();
  const { data } = await supabase.from("traveler_docs").select("ticket_path").eq("trip_id", tripId).maybeSingle();
  if (!data) return { error: "Esta viagem não tem documentos." };
  const { data: signed, error } = await supabase.storage.from("tickets").createSignedUrl(data.ticket_path, 120);
  if (error || !signed) return { error: "Não foi possível abrir a foto." };
  console.info("[auditoria] bilhete consultado", { equipa: profile.id, viagem: tripId });
  return { url: signed.signedUrl };
}

export async function setDocStatus(tripId: string, status: "confirmado" | "recusado" | "pendente") {
  const { supabase, profile } = await requireAdmin();
  if (!["confirmado", "recusado", "pendente"].includes(status)) return;
  await supabase.from("traveler_docs").update({ status }).eq("trip_id", tripId);
  console.info("[auditoria] documentos", { equipa: profile.id, viagem: tripId, estado: status });
  done();
}

// ---------- carteira: confirmar o pagamento e reter o valor ----------
const METHODS = ["Transferência bancária", "Multicaixa Express", "Numerário"];

/** A equipa confirma que recebeu o pagamento: o valor fica retido e nasce o código de entrega (que só quem enviou vê). */
export async function fundDeal(dealId: string, _: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase, profile } = await requireAdmin();
  const method = String(fd.get("method") ?? "");
  const reference = String(fd.get("reference") ?? "").trim().slice(0, 120);
  if (!METHODS.includes(method)) return { error: "Escolhe como o pagamento foi feito." };
  if (!piiReady()) return { error: "Falta a chave de cifra (PII_KEY): não é possível criar o código de entrega." };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await supabase.rpc("fund_deal", { p_deal: dealId, p_method: method, p_reference: reference, p_code: code, p_code_enc: encryptPii(code) });
  if (error) return { error: ["P0001", "42501", "22023"].includes(error.code ?? "") ? error.message : "Não foi possível confirmar o pagamento." };
  console.info("[auditoria] pagamento confirmado", { equipa: profile.id, entrega: dealId, metodo: method });
  done();
  return { message: "Pagamento confirmado. O valor ficou retido." };
}

// ---------- feedback ----------
export async function setFeedbackStatus(id: string, status: "novo" | "lido" | "resolvido") {
  const { supabase } = await requireAdmin();
  if (!["novo", "lido", "resolvido"].includes(status)) return;
  await supabase.from("feedback").update({ status }).eq("id", id);
  done();
}

export async function deleteFeedback(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("feedback").delete().eq("id", id);
  done();
}

/** Ligação à fatura de um pedido, válida só 2 minutos. A fatura nunca é pública. */
export async function invoiceUrl(requestId: string): Promise<{ url?: string; error?: string }> {
  const { supabase, profile } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return { error: "Pedido inválido." };
  const { data } = await supabase.from("requests").select("invoice_path").eq("id", requestId).maybeSingle();
  if (!data?.invoice_path) return { error: "Este pedido não tem fatura." };
  const { data: signed, error } = await supabase.storage.from("invoices").createSignedUrl(data.invoice_path, 120);
  if (error || !signed) return { error: "Não foi possível abrir a fatura." };
  console.info("[auditoria] fatura consultada", { equipa: profile.id, pedido: requestId });
  return { url: signed.signedUrl };
}

// ---------- identificação (BI + telefone, passaporte opcional), feita uma só vez no cadastro ----------
type IdKind = "bi" | "passport";

/** Mostra o número do BI ou do passaporte (decifrado só aqui, no servidor, e só à equipa). Cada consulta fica no registo. */
export async function revealIdNumber(userId: string, kind: IdKind): Promise<{ value?: string; error?: string }> {
  const { supabase, profile } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Pessoa inválida." };
  const col = kind === "bi" ? "bi_enc" : "passport_enc";
  const { data } = await supabase.from("identities").select(col).eq("user_id", userId).maybeSingle();
  const enc = (data as Record<string, string | null> | null)?.[col];
  if (!enc) return { error: "Este documento não foi indicado." };
  const value = decryptPii(enc);
  if (!value) return { error: "Não foi possível ler o número (a chave de cifra pode estar em falta)." };
  console.info("[auditoria] número de identificação consultado", { equipa: profile.id, pessoa: userId, tipo: kind });
  return { value };
}

/** Ligação à foto do BI ou do passaporte, válida só 2 minutos. A foto nunca é pública. */
export async function idPhotoUrl(userId: string, kind: IdKind | "bi_back" | "passport_last"): Promise<{ url?: string; error?: string }> {
  const { supabase, profile } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Pessoa inválida." };
  const col = ({ bi: "bi_photo_path", bi_back: "bi_back_path", passport: "passport_photo_path", passport_last: "passport_last_path" } as const)[kind];
  if (!col) return { error: "Documento inválido." };
  const { data } = await supabase.from("identities").select(col).eq("user_id", userId).maybeSingle();
  const path = (data as Record<string, string | null> | null)?.[col];
  if (!path) return { error: "Este documento não foi indicado." };
  const { data: signed, error } = await supabase.storage.from("ids").createSignedUrl(path, 120);
  if (error || !signed) return { error: "Não foi possível abrir a foto." };
  console.info("[auditoria] foto de identificação consultada", { equipa: profile.id, pessoa: userId, tipo: kind });
  return { url: signed.signedUrl };
}

export async function setIdentityStatus(userId: string, status: "confirmado" | "recusado" | "pendente") {
  const { supabase, profile } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !["confirmado", "recusado", "pendente"].includes(status)) return;
  await supabase.from("identities").update({ status }).eq("user_id", userId);
  console.info("[auditoria] identificação", { equipa: profile.id, pessoa: userId, estado: status });
  done();
}
