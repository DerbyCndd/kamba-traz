import { createClient } from "./supabase/server";
import { decryptPii } from "./pii";
import { today } from "./format";
import type { Deal, DealReport, Reputation, LedgerRow, Offer, Position, Wallet, Config, PendingRating, RatingRole, RatingSummary, ReqPreview, ReqPub, TopEntry, TripPreview, TripPub, WaiverHolder, Winner } from "./types";

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

/** Preço de referência e taxa, públicos (calculadora da página inicial). Nulo até correr supabase/public-pricing.sql. */
export async function getPublicPricing(): Promise<{ per_kg: number; commission: number } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_pricing");
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;
  return { per_kg: Number(row.per_kg), commission: Number(row.commission) };
}

/** As entregas em que a pessoa participa (a equipa vê todas). Só chega o que as regras de acesso permitem. */
export async function getMyDeals(): Promise<Deal[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Deal[];
}

/** As minhas propostas (enviadas e recebidas), com os dados públicos do pedido e da viagem a que se referem. `available` é falso até correr offers.sql. */
export async function getMyOffers(): Promise<{ available: boolean; offers: Offer[]; requests: Record<string, ReqPub>; trips: Record<string, TripPub> }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false }).limit(150);
  if (error) return { available: false, offers: [], requests: {}, trips: {} };
  const offers = (data ?? []) as Offer[];
  const rid = [...new Set(offers.map((o) => o.request_id))];
  const tid = [...new Set(offers.map((o) => o.trip_id))];
  const [r, t] = await Promise.all([
    rid.length ? supabase.from("requests_public").select("*").in("id", rid) : Promise.resolve({ data: [] }),
    tid.length ? supabase.from("trips_public").select("*").in("id", tid) : Promise.resolve({ data: [] }),
  ]);
  return {
    available: true, offers,
    requests: Object.fromEntries(((r.data ?? []) as ReqPub[]).map((x) => [x.id, x])),
    trips: Object.fromEntries(((t.data ?? []) as TripPub[]).map((x) => [x.id, x])),
  };
}

/** Quantas propostas estão à espera da resposta desta pessoa (0 se as propostas ainda não estão ativas). */
export async function getOffersWaiting(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("offers").select("id", { count: "exact", head: true }).eq("to_user", userId).eq("status", "aberta");
  return error ? 0 : (count ?? 0);
}

/** Acordos fechados entre as partes, à espera de a equipa criar a entrega (só a equipa os vê todos). */
export async function getAgreements(): Promise<Offer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("offers").select("*").eq("status", "aceite").order("responded_at", { ascending: false });
  return error ? [] : ((data ?? []) as Offer[]);
}

export type DealPhoto = { id: string; url: string; created_at: string };

/** Fotos do estado do volume na recolha. `available` é falso enquanto o SQL das fotos não foi corrido (a app não as pede). */
export async function getDealPhotos(dealId: string): Promise<{ available: boolean; photos: DealPhoto[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("deal_photos").select("id, path, created_at").eq("deal_id", dealId).eq("kind", "recolha").order("created_at");
  if (error) return { available: false, photos: [] };
  const rows = (data ?? []) as { id: string; path: string; created_at: string }[];
  if (!rows.length) return { available: true, photos: [] };
  const { data: signed } = await supabase.storage.from("deal-photos").createSignedUrls(rows.map((r) => r.path), 3600);
  const photos = rows.flatMap((r, i) => (signed?.[i]?.signedUrl ? [{ id: r.id, url: signed[i].signedUrl as string, created_at: r.created_at }] : []));
  return { available: true, photos };
}

export async function getDeal(id: string): Promise<Deal | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("deals").select("*").eq("id", id).maybeSingle();
  return (data as Deal) ?? null;
}

/** Os últimos pontos da posição do entregador, do mais antigo ao mais recente. */
export async function getPositions(dealId: string): Promise<Position[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("delivery_positions").select("id, lat, lng, accuracy, at").eq("deal_id", dealId).order("id", { ascending: false }).limit(200);
  return ((data ?? []) as Position[]).reverse();
}

export async function getWallet(): Promise<Wallet> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_wallet");
  const r = (Array.isArray(data) ? data[0] : data) ?? {};
  const n = (x: unknown) => Number(x ?? 0);
  return { held: n(r.held), to_receive: n(r.to_receive), received: n(r.received), refunded: n(r.refunded), paid: n(r.paid) };
}

export async function getLedger(): Promise<LedgerRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("wallet_ledger").select("id, kind, amount, note, created_at, deal_id").order("id", { ascending: false }).limit(60);
  return (data ?? []) as LedgerRow[];
}

/** Código de entrega, só para quem enviou (decifrado aqui, no servidor). */
export async function getDeliveryCode(dealId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("deal_secrets").select("code_enc").eq("deal_id", dealId).maybeSingle();
  return data?.code_enc ? decryptPii(data.code_enc) : null;
}

/** Reputação das outras partes (média, avaliações, entregas concluídas, identificação confirmada). Vazio se protecao.sql ainda não foi corrido. */
export async function getReputations(ids: string[]): Promise<Record<string, Reputation>> {
  const list = [...new Set(ids.filter(Boolean))];
  if (!list.length) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("party_reputation", { p_users: list });
  if (error || !data) return {};
  return Object.fromEntries((data as Reputation[]).map((r) => [r.user_id, r]));
}

/** As minhas denúncias numa entrega (a equipa vê todas na aba «Denúncias»). Vazio se protecao.sql ainda não foi corrido. */
export async function getMyReports(dealId: string): Promise<{ available: boolean; reports: DealReport[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("deal_reports").select("*").eq("deal_id", dealId).order("created_at", { ascending: false });
  if (error) return { available: false, reports: [] };
  return { available: true, reports: (data ?? []) as DealReport[] };
}
