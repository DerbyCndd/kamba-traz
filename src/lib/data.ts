import { createClient } from "./supabase/server";
import { today } from "./format";
import type { Config, PendingRating, RatingRole, RatingSummary, ReqPreview, ReqPub, TopEntry, TripPreview, TripPub, WaiverHolder, Winner } from "./types";

const DEFAULT_CONFIG: Config = { commission: 12, per_kg: 8000, whatsapp: "" };

export async function getConfig(): Promise<Config> {
  const supabase = await createClient();
  const { data } = await supabase.from("config").select("commission, per_kg, whatsapp").eq("id", 1).maybeSingle();
  return data ? { commission: Number(data.commission), per_kg: data.per_kg, whatsapp: data.whatsapp } : DEFAULT_CONFIG;
}

/** Entradas à espera de verificação. Só devolve valor à equipa (o RLS esconde o resto). */
export async function getPendingCount(): Promise<number> {
  const supabase = await createClient();
  const [a, b] = await Promise.all([
    supabase.from("trips").select("id", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "pendente"),
  ]);
  return (a.count ?? 0) + (b.count ?? 0);
}

/** Viagens abertas e futuras, da mais próxima à mais distante. */
export async function getOpenTrips(from?: string): Promise<TripPub[]> {
  const supabase = await createClient();
  let q = supabase.from("trips_public").select("*").neq("status", "concluida").gte("travel_date", today()).order("travel_date");
  if (from) q = q.eq("origin", from);
  const { data } = await q.limit(200);
  return (data ?? []) as TripPub[];
}

export async function getOpenRequests(from?: string): Promise<ReqPub[]> {
  const supabase = await createClient();
  let q = supabase.from("requests_public").select("*").eq("status", "aberto").order("created_at", { ascending: false });
  if (from) q = q.eq("origin", from);
  const { data } = await q.limit(200);
  return (data ?? []) as ReqPub[];
}

/** Início do mês corrente em Luanda (UTC+1), como instante ISO. As avaliações do prémio contam a partir daqui. */
export const monthStart = () => {
  const [y, m] = today().split("-");
  return `${y}-${m}-01T00:00:00+01:00`;
};

/** Os 3 mais bem classificados de cada função, no mês corrente. Vazio até haver avaliações (ou antes de correr supabase/ratings.sql). */
export async function getTopRated(): Promise<{ travelers: TopEntry[]; requesters: TopEntry[] }> {
  const supabase = await createClient();
  const [t, r] = await Promise.all([
    supabase.rpc("top_rated", { p_role: "traveler", p_limit: 3, p_since: monthStart() }),
    supabase.rpc("top_rated", { p_role: "requester", p_limit: 3, p_since: monthStart() }),
  ]);
  return { travelers: (t.data ?? []) as TopEntry[], requesters: (r.data ?? []) as TopEntry[] };
}

/** Ganhadores do mês passado (só o primeiro nome). Este mês estão sem taxas. */
export async function getLastWinners(): Promise<Winner[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("last_month_winners");
  return (data ?? []) as Winner[];
}

/** Funções em que esta pessoa tem a isenção este mês. */
export async function getMyWaivers(): Promise<RatingRole[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_fee_waivers");
  return ((data ?? []) as { role: RatingRole }[]).map((x) => x.role);
}

/** Quem tem a isenção agora, com o identificador (só a equipa pode chamar). */
export async function getWaiverHolders(): Promise<WaiverHolder[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("fee_waiver_holders");
  return (data ?? []) as WaiverHolder[];
}

/** Entregas concluídas que esta pessoa ainda não avaliou. */
export async function getPendingRatings(): Promise<PendingRating[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_pending_ratings");
  return (data ?? []) as PendingRating[];
}

export async function getMyRatings(): Promise<Partial<Record<RatingRole, { avg: number; total: number }>>> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_rating_summary");
  const out: Partial<Record<RatingRole, { avg: number; total: number }>> = {};
  for (const x of (data ?? []) as RatingSummary[]) out[x.ratee_role] = { avg: Number(x.avg_stars), total: x.total };
  return out;
}

/** O que a página inicial mostra a quem ainda não tem conta: só rota, peso, data e valor (nada de nomes nem contactos). */
export async function getPreview(): Promise<{ trips: TripPreview[]; reqs: ReqPreview[]; tripCount: number; reqCount: number }> {
  const supabase = await createClient();
  const [t, r] = await Promise.all([
    supabase.from("trips_preview").select("*", { count: "exact" }).order("travel_date").limit(4),
    supabase.from("requests_preview").select("*", { count: "exact" }).order("kg", { ascending: false }).limit(4),
  ]);
  return {
    trips: (t.data ?? []) as TripPreview[], reqs: (r.data ?? []) as ReqPreview[],
    tripCount: t.count ?? 0, reqCount: r.count ?? 0,
  };
}
