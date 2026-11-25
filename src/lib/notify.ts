import "server-only";
import { createClient } from "./supabase/server";
import { DEAL_LABEL, statusEmail, type DealStatus } from "./deal-flow";
import { refCode } from "./format";

/**
 * Avisa as duas partes por email de uma mudança de estado da entrega. Nunca falha a ação:
 * sem RESEND_API_KEY ou sem estados-entrega.sql, simplesmente não envia.
 * Os emails são lidos na base de dados só com o segredo do servidor (RATE_LIMIT_SECRET); nunca chegam ao navegador.
 */
export async function notifyDeal(dealId: string): Promise<void> {
  const key = process.env.RESEND_API_KEY, secret = process.env.RATE_LIMIT_SECRET;
  if (!key || !secret) return;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("deal_notify_info", { p_secret: secret, p_deal: dealId });
    const row = (Array.isArray(data) ? data[0] : data) as { label: string; status: string; sender_email: string | null; traveler_email: string | null } | undefined;
    if (error || !row || !(row.status in DEAL_LABEL)) return;
    const to = [row.sender_email, row.traveler_email].filter((e): e is string => !!e);
    if (!to.length) return;
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://kamba-traz-app.vercel.app").replace(/\/$/, "");
    const { subject, text } = statusEmail(row.status as DealStatus, row.label, refCode(dealId), `${site}/entregas/${dealId}`);
    // Um email por pessoa: nenhuma vê o endereço da outra.
    await Promise.all(to.map((addr) => fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM || process.env.DIGEST_FROM || "Kamba Traz <onboarding@resend.dev>", to: [addr], subject, text }),
    }).catch(() => null)));
  } catch { /* o aviso nunca impede a entrega */ }
}
