"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export type DropoffState = { error?: string; done?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O dono da viagem muda onde recebe encomendas (em branco = deixa de indicar). Só quem envia o vê, com o pagamento retido. */
export async function saveDropoff(_: DropoffState, fd: FormData): Promise<DropoffState> {
  const { supabase } = await requireUser();
  const trip = String(fd.get("trip") ?? "");
  const address = String(fd.get("dropoff_address") ?? "").trim();
  let notes = String(fd.get("dropoff_notes") ?? "").trim();
  let map = String(fd.get("dropoff_map") ?? "").trim();
  if (!UUID.test(trip)) return { error: "Viagem inválida." };
  if (address && (address.length < 8 || address.length > 300)) return { error: "Escreve a morada completa, ou deixa em branco para deixar de a indicar." };
  if (notes.length > 300) return { error: "As notas são demasiado longas." };
  if (map && !/^https?:\/\/\S{4,290}$/i.test(map)) return { error: "Cola uma ligação do mapa que comece por https://, ou deixa em branco." };
  if (!address) { notes = ""; map = ""; }
  const { error } = await supabase.rpc("set_trip_dropoff", { p_trip: trip, p_address: address, p_notes: notes, p_map: map });
  if (error) return { error: ["P0001", "42501", "22023"].includes(error.code ?? "") ? error.message : "Não foi possível guardar agora. Tenta de novo daqui a pouco." };
  revalidatePath("/meus");
  return { done: true };
}
