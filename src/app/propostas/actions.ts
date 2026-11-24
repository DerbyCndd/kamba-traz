"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { myVerification } from "@/lib/identity";
import { missingFor, needsText, type VerifAction } from "@/lib/verification";

export type OfferState = { error?: string; done?: "aceite" | "recusada" | "contraproposta" | "indisponivel" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Os erros que escrevemos na base de dados são seguros de mostrar; os outros ficam genéricos.
const safe = (e: { code?: string; message: string }) => {
  if (e.code === "PGRST202") return "As propostas ainda não estão ativas.";
  return ["P0001", "42501", "22023"].includes(e.code ?? "") ? e.message : "Não foi possível agora. Tenta de novo daqui a pouco.";
};
/** Mensagem de falta de nível, ou null se a pessoa pode avançar. A base de dados volta a confirmar (niveis.sql). */
async function levelError(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], user: Awaited<ReturnType<typeof requireUser>>["user"], action: VerifAction) {
  const falta = missingFor(action, (await myVerification(supabase, user)).input);
  if (!falta.length) return null;
  return `${action === "aceitar_pedido" ? "Para levar encomendas precisas do nível 2" : "Para isto precisas do nível 1"} de verificação. Falta: ${needsText(falta)}. Vê em Meu perfil.`;
}
const kzOf = (v: FormDataEntryValue | null) => { const n = Math.round(parseFloat(String(v ?? "").replace(",", "."))); return Number.isFinite(n) ? n : 0; };

/** Faz uma proposta de valor (quem viaja, a um pedido; ou quem envia, a uma viagem). A base de dados verifica quem é quem. */
export async function makeOffer(_: OfferState, fd: FormData): Promise<OfferState> {
  const { user, supabase } = await requireUser();
  const request = String(fd.get("request") ?? "");
  const trip = String(fd.get("trip") ?? "");
  const price = kzOf(fd.get("price"));
  if (!UUID.test(request) || !UUID.test(trip)) return { error: "Escolhe o pedido e a viagem." };
  if (!(price >= 1)) return { error: "Indica o valor em Kz." };
  if (price > 100_000_000) return { error: "Confirma o valor: é demasiado alto." };
  // Propor a partir da minha viagem = vou levar (nível 2); a partir do meu pedido = vou enviar (nível 1).
  const mineTrip = await supabase.from("trips").select("id").eq("id", trip).eq("user_id", user.id).maybeSingle();
  const lvl = await levelError(supabase, user, mineTrip.data ? "aceitar_pedido" : "publicar_pedido");
  if (lvl) return { error: lvl };
  const { error } = await supabase.rpc("make_offer", { p_request: request, p_trip: trip, p_price: price });
  if (error) return { error: safe(error) };
  revalidatePath("/propostas");
  revalidatePath("/", "layout");
  redirect("/propostas");
}

/** Responde a uma proposta: aceitar, recusar ou propor outro valor. */
export async function respondOffer(_: OfferState, fd: FormData): Promise<OfferState> {
  const { user, supabase } = await requireUser();
  const offer = String(fd.get("offer") ?? "");
  const action = String(fd.get("action") ?? "");
  if (!UUID.test(offer)) return { error: "Proposta inválida." };
  if (!["aceitar", "recusar", "contrapor"].includes(action)) return { error: "Escolhe o que queres fazer." };
  const price = action === "contrapor" ? kzOf(fd.get("price")) : null;
  if (action === "contrapor" && !(price && price >= 1)) return { error: "Indica o novo valor em Kz." };
  if (action !== "recusar") {
    // Aceitar (ou contrapor) uma proposta de quem envia = vou levar: nível 2. A de quem viaja = vou enviar: nível 1.
    const { data: o } = await supabase.from("offers").select("from_role, to_user").eq("id", offer).maybeSingle();
    if (o && o.to_user === user.id) {
      const lvl = await levelError(supabase, user, o.from_role === "requester" ? "aceitar_pedido" : "publicar_pedido");
      if (lvl) return { error: lvl };
    }
  }
  const { data, error } = await supabase.rpc("respond_offer", { p_offer: offer, p_action: action, p_price: price });
  if (error) return { error: safe(error) };
  revalidatePath("/propostas");
  revalidatePath("/", "layout");
  return { done: data as OfferState["done"] };
}
