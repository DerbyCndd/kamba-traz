"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

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
  revalidatePath(`/entregas/${dealId}`);
  revalidatePath("/entregas");
  return { done: true };
}

/** O entregador introduz o código que quem recebe lhe deu. A verificação é feita na base de dados, com limite de tentativas. */
export async function confirmDelivery(_: DeliveryState, fd: FormData): Promise<DeliveryState> {
  const { supabase } = await requireUser();
  const deal = String(fd.get("deal") ?? "");
  const code = String(fd.get("code") ?? "").replace(/\D/g, "");
  if (!UUID.test(deal)) return { error: "Entrega inválida." };
  if (code.length !== 6) return { error: "O código tem 6 dígitos." };

  const { data, error } = await supabase.rpc("confirm_delivery", { p_deal: deal, p_code: code });
  if (error) return { error: safe(error) };
  if (data === "ok") {
    revalidatePath(`/entregas/${deal}`);
    revalidatePath("/entregas");
    revalidatePath("/carteira");
    return { done: true };
  }
  if (data === "bloqueado") return { error: "Demasiadas tentativas erradas. Fala com a equipa." };
  const left = /^errado:(\d+)/.exec(String(data))?.[1];
  return { error: left ? `Código errado. Restam ${left} tentativas.` : "Código errado." };
}
