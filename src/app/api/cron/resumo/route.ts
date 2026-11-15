import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Digest = {
  trips_pending: number; requests_pending: number; old_pending: number; identities_pending: number;
  agreements_waiting: number; offers_open: number; deals_unpaid: number; deals_in_transit: number;
  new_accounts_24h: number; login_attempts_24h: number; signup_attempts_24h: number;
};

// Limites a partir dos quais o resumo chama a atenção (ajusta se for preciso).
const LOGIN_ALERT = 50;
const SIGNUP_ALERT = 20;

function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function build(d: Digest) {
  const todo: string[] = [];
  if (d.old_pending) todo.push(`${d.old_pending} entrada(s) por aprovar há mais de 24 h`);
  const waiting = d.trips_pending + d.requests_pending;
  if (waiting) todo.push(`${waiting} entrada(s) por aprovar (${d.requests_pending} pedido(s), ${d.trips_pending} viagem(ns))`);
  if (d.identities_pending) todo.push(`${d.identities_pending} identificação(ões) por confirmar`);
  if (d.agreements_waiting) todo.push(`${d.agreements_waiting} acordo(s) por transformar em entrega`);
  if (d.deals_unpaid) todo.push(`${d.deals_unpaid} entrega(s) à espera do pagamento`);
  const alerts: string[] = [];
  if (d.login_attempts_24h >= LOGIN_ALERT) alerts.push(`${d.login_attempts_24h} tentativas de entrada nas últimas 24 h`);
  if (d.signup_attempts_24h >= SIGNUP_ALERT) alerts.push(`${d.signup_attempts_24h} tentativas de registo nas últimas 24 h`);
  const lines = ["Kamba Traz · resumo do dia"];
  lines.push(todo.length ? "Por fazer:\n- " + todo.join("\n- ") : "Nada parado: tudo em dia.");
  if (alerts.length) lines.push("Atenção:\n- " + alerts.join("\n- "));
  lines.push(`Em curso: ${d.deals_in_transit} entrega(s) em trânsito, ${d.offers_open} proposta(s) em aberto, ${d.new_accounts_24h} conta(s) nova(s) em 24 h.`);
  return { text: lines.join("\n\n"), urgent: d.old_pending > 0 || alerts.length > 0 };
}

async function send(text: string, subject: string) {
  const sent: string[] = [];
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    const r = await fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text }),
    }).catch(() => null);
    if (r?.ok) sent.push("telegram");
  }
  const key = process.env.RESEND_API_KEY, to = process.env.DIGEST_EMAIL;
  if (key && to) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.DIGEST_FROM || "Kamba Traz <onboarding@resend.dev>", to: [to], subject, text }),
    }).catch(() => null);
    if (r?.ok) sent.push("email");
  }
  return sent;
}

/** Chamado todos os dias pela Vercel (vercel.json). Só aceita o segredo CRON_SECRET; sem ele, recusa sempre. Só envia contagens, nunca dados de pessoas. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const auth = request.headers.get("authorization") ?? "";
  if (secret.length < 16 || !same(auth, `Bearer ${secret}`)) return new Response("Não autorizado", { status: 401 });

  const rl = process.env.RATE_LIMIT_SECRET ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("team_digest", { p_secret: rl });
  if (error || !data) {
    const sent = await send("Kamba Traz: o resumo diário não conseguiu ler a base de dados. Verifica se o supabase/monitor.sql foi corrido e se a base está a responder.", "Kamba Traz: o resumo diário falhou");
    return Response.json({ ok: false, sent }, { status: 502 });
  }
  const { text, urgent } = build(data as Digest);
  const sent = await send(text, (urgent ? "Atenção · " : "") + "Kamba Traz: resumo do dia");
  return Response.json({ ok: true, sent, urgent });
}
