"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { CATS, FROM, TO } from "@/lib/constants";
import { cityName, kz, refCode, today } from "@/lib/format";
import type { FormState } from "@/lib/types";

const MAX_PENDING = 10; // limite de entradas por verificar por pessoa (evita spam)

function read(fd: FormData) {
  const v: Record<string, string> = {};
  fd.forEach((x, k) => { if (typeof x === "string") v[k] = x.trim(); });
  return v;
}
const num = (s: string) => { const n = parseFloat(s); return Number.isFinite(n) && n > 0 ? n : null; };
const phoneOk = (s: string) => s.replace(/\D/g, "").length >= 9 && s.length <= 30;

async function tooManyPending(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], userId: string) {
  const [a, b] = await Promise.all([
    supabase.from("trips").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pendente"),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pendente"),
  ]);
  return (a.count ?? 0) + (b.count ?? 0) >= MAX_PENDING;
}

export async function submitRequest(_: FormState, fd: FormData): Promise<FormState> {
  const { user, supabase } = await requireUser();
  const v = read(fd);
  const errors: Record<string, string> = {};

  if (v.name.length < 2 || v.name.length > 60) errors.name = "Escreve o teu nome.";
  if (!phoneOk(v.contact)) errors.contact = "Indica um número com indicativo, por exemplo +244 923 000 000.";
  if (v.item.length < 3 || v.item.length > 90) errors.item = "Descreve o que queres enviar.";
  if (!num(v.kg) || num(v.kg)! > 100) errors.kg = "Indica o peso aproximado em kg.";
  if (v.value === "" || !(Number(v.value) >= 0)) errors.value = "Indica o valor do item em euros.";
  if (!num(v.offer)) errors.offer = "Indica quanto ofereces pelo transporte, em Kz.";
  if (v.ok !== "on") errors.ok = "Tens de confirmar para continuar.";
  if (!FROM.includes(v.origin) || !TO.includes(v.destination) || !CATS.includes(v.category)) errors.item = "Escolhe valores válidos da lista.";
  else if (v.origin === v.destination && v.origin !== "OTH") errors.item = "A origem e o destino não podem ser iguais.";
  if (v.deadline && v.deadline < today()) errors.deadline = "A data já passou.";
  if (Object.keys(errors).length) return { errors, values: v };

  if (await tooManyPending(supabase, user.id)) {
    return { errors: {}, values: v, formError: "Já tens muitas entradas por verificar. Espera que a equipa as analise." };
  }

  const row = {
    user_id: user.id, name: v.name, contact: v.contact, origin: v.origin, destination: v.destination,
    item: v.item, category: v.category, kg: num(v.kg)!, item_value: Number(v.value), offer: Math.round(num(v.offer)!),
    deadline: v.deadline || null,
  };
  const { data, error } = await supabase.from("requests").insert(row).select("id").single();
  if (error || !data) return { errors: {}, values: v, formError: "Não foi possível registar o pedido agora. Tenta de novo daqui a pouco." };

  revalidatePath("/meus");
  const summary = [
    "PEDIDO · Kamba Traz", "Nome: " + row.name, "Contacto: " + row.contact,
    `Rota: ${cityName(row.origin)} → ${cityName(row.destination)}`, `Item: ${row.item} (${row.category})`,
    `Peso: ${row.kg} kg`, `Valor do item: ${row.item_value} €`, "Oferta pelo transporte: " + kz(row.offer),
    row.deadline ? "Preciso até: " + row.deadline : null,
  ].filter(Boolean).join("\n");
  return { errors: {}, values: {}, done: { ref: "KT-" + refCode(data.id), summary, kind: "request" } };
}

export async function submitTrip(_: FormState, fd: FormData): Promise<FormState> {
  const { user, supabase } = await requireUser();
  const v = read(fd);
  const errors: Record<string, string> = {};

  if (v.name.length < 2 || v.name.length > 60) errors.name = "Escreve o teu nome.";
  if (!phoneOk(v.contact)) errors.contact = "Indica um número com indicativo, por exemplo +351 912 000 000.";
  if (!v.date || v.date < today()) errors.date = "Escolhe a data da viagem.";
  if (!num(v.kg) || num(v.kg)! > 100) errors.kg = "Indica quantos kg tens livres.";
  if (!num(v.perKg)) errors.perKg = "Indica o preço por kg em Kz.";
  if (v.flight && v.flight.length > 30) errors.flight = "Demasiado longo.";
  if (v.ok !== "on") errors.ok = "Tens de confirmar para continuar.";
  if (!FROM.includes(v.origin) || !TO.includes(v.destination)) errors.date = "Escolhe valores válidos da lista.";
  else if (v.origin === v.destination && v.origin !== "OTH") errors.date = "A origem e o destino não podem ser iguais.";
  if (Object.keys(errors).length) return { errors, values: v };

  if (await tooManyPending(supabase, user.id)) {
    return { errors: {}, values: v, formError: "Já tens muitas entradas por verificar. Espera que a equipa as analise." };
  }

  const row = {
    user_id: user.id, name: v.name, contact: v.contact, origin: v.origin, destination: v.destination,
    travel_date: v.date, flight: v.flight || "", kg: num(v.kg)!, per_kg: Math.round(num(v.perKg)!),
  };
  const { data, error } = await supabase.from("trips").insert(row).select("id").single();
  if (error || !data) return { errors: {}, values: v, formError: "Não foi possível registar a viagem agora. Tenta de novo daqui a pouco." };

  revalidatePath("/meus");
  const summary = [
    "VIAGEM · Kamba Traz", "Nome: " + row.name, "Contacto: " + row.contact,
    `Rota: ${cityName(row.origin)} → ${cityName(row.destination)}`, "Data: " + row.travel_date,
    row.flight ? "Voo: " + row.flight : null, `Espaço livre: ${row.kg} kg`, "Preço por kg: " + kz(row.per_kg),
  ].filter(Boolean).join("\n");
  return { errors: {}, values: {}, done: { ref: "KT-" + refCode(data.id), summary, kind: "trip" } };
}
