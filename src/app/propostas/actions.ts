"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export type OfferState = { error?: string; done?: "aceite" | "recusada" | "contraproposta" | "indisponivel" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Os erros que escrevemos na base de dados são seguros de mostrar; os outros ficam genéricos.
const safe = (e: { code?: string; message: string }) => {
  if (e.code === "PGRST202") return "As propostas ainda não estão ativas.";
  return ["P0001", "42501", "22023"].includes(e.code ?? "") ? e.message : "Não foi possível agora. Tenta de novo daqui a pouco.";
};
const kzOf = (v: FormDataEntryValue | null) => { const n = Math.round(parseFloat(String(v ?? "").replace(",", "."))); return Number.isFinite(n) ? n : 0; };

/** Faz uma proposta de valor (quem viaja, a um pedido; ou quem envia, a uma viagem). A base de dados verifica quem é quem. */
export async function makeOffer(_: OfferState, fd: FormData): Promise<OfferState> {
  const { supabase } = await requireUser();
  const request = String(fd.get("request") ?? "");
  const trip = String(fd.get("trip") ?? "");
  const price = kzOf(fd.get("price"));
  if (!UUID.test(request) || !UUID.test(trip)) return { error: "Escolhe o pedido e a viagem." };
  if (!(price >= 1)) return { error: "Indica o valor em Kz." };
  if (price > 100_000_000) return { error: "Confirma o valor: é demasiado alto." };
  const { error } = await supabase.rpc("make_offer", { p_request: request, p_trip: trip, p_price: price });
  if (error) return { error: safe(error) };
  revalidatePath("/propostas");
  revalidatePath("/", "layout");
  redirect("/propostas");
}

/** Responde a uma proposta: aceitar, recusar ou propor outro valor. */
export async function respondOffer(_: OfferState, fd: FormData): Promise<OfferState> {
  const { supabase } = await requireUser();
  const offer = String(fd.get("offer") ?? "");
  const action = String(fd.get("action") ?? "");
  if (!UUID.test(offer)) return { error: "Proposta inválida." };
  if (!["aceitar", "recusar", "contrapor"].includes(action)) return { error: "Escolhe o que queres fazer." };
  const price = action === "contrapor" ? kzOf(fd.get("price")) : null;
  if (action === "contrapor" && !(price && price >= 1)) return { error: "Indica o novo valor em Kz." };
  const { data, error } = await supabase.rpc("respond_offer", { p_offer: offer, p_action: action, p_price: price });
  if (error) return { error: safe(error) };
  revalidatePath("/propostas");
  revalidatePath("/", "layout");
  return { done: data as OfferState["done"] };
}
