"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { CATS, DEAL_STEPS, REQ_STATES, TRIP_STATES } from "@/lib/constants";
import { firstName } from "@/lib/format";

export type AdminState = { error?: string; message?: string };

type Kind = "trip" | "request";
const TABLE = (k: Kind) => (k === "trip" ? "trips" : "requests");
const done = () => revalidatePath("/", "layout");

export async function approveItem(kind: Kind, id: string) {
  const { supabase } = await requireAdmin();
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
    supabase.from("requests").select("id, item, origin, destination, name, status").eq("id", requestId).maybeSingle(),
    supabase.from("trips").select("id, name, status").eq("id", tripId).maybeSingle(),
    supabase.from("config").select("commission").eq("id", 1).maybeSingle(),
  ]);
  if (!r || !t) return { error: "Pedido ou viagem não encontrados." };
  if (r.status !== "aberto") return { error: "Esse pedido já não está aberto." };

  // Prémio do mês: se o entregador ou o remetente ganhou o mês passado, a comissão é 0. Quem decide é a base de dados.
  const { data: waived } = await supabase.rpc("deal_fee_waived", { p_request: r.id, p_trip: t.id });
  const fee_waived = waived === true;
  const pct = fee_waived ? 0 : Number(c?.commission ?? 12);
  const { error } = await supabase.from("deals").insert({
    request_id: r.id, trip_id: t.id, label: `${r.item} · ${r.origin} → ${r.destination}`,
    traveler: firstName(t.name), requester: firstName(r.name), price,
    commission_pct: pct, commission: Math.round((price * pct) / 100), status: "negociacao",
    ...(fee_waived ? { fee_waived: true } : {}),
  });
  if (error) return { error: "Não foi possível criar a entrega." };
  await supabase.from("requests").update({ status: "ligado" }).eq("id", r.id);
  done();
  return { message: fee_waived ? "Entrega criada, sem comissão (prémio do mês)." : "Entrega criada." };
}

export async function setDealStatus(id: string, status: string) {
  const { supabase } = await requireAdmin();
  if (![...DEAL_STEPS.map((s) => s[0]), "cancelado"].includes(status)) return;
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
    { ...common, origin: "FAO", destination: "SDD", item: "Medicamentos com receita", category: CATS[5], kg: 0.8, offer: 25000, name: "Domingos" },
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
