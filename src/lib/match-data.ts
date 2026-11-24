import "server-only";
import type { createClient } from "./supabase/server";
import { rankRequests, rankTrips, type Match, type MatchRequest, type MatchTrip } from "./matching";
import type { Deal, Req, Trip } from "./types";

type Supa = Awaited<ReturnType<typeof createClient>>;

/** O que se mostra de uma viagem sugerida: só dados públicos (primeiro nome, data, espaço, preço, avaliação). */
export type TripSuggestion = { match: Match; trip: { id: string; travel_date: string; kg: number; per_kg: number; name: string; rating: number | null; rating_count: number } };
/** O que se mostra de um pedido sugerido: só dados públicos (sem o valor do item nem contactos). */
export type RequestSuggestion = { match: Match; req: { id: string; item: string; category: string; kg: number; offer: number | null; deadline: string | null; name: string } };
/** Sugestão para a equipa: o par e a explicação. */
export type TeamSuggestion = { match: Match; req: Req; trip: Trip };

type Stats = Map<string, { dealsDone: number; committedEur: number }>;

/** Entregas concluídas e valor já comprometido por viagem (match_trip_stats). Vazio se matching.sql ainda não foi corrido. */
async function tripStats(supabase: Supa, ids: string[]): Promise<Stats> {
  if (!ids.length) return new Map();
  const { data, error } = await supabase.rpc("match_trip_stats", { p_trips: ids });
  if (error || !Array.isArray(data)) return new Map();
  return new Map((data as { trip_id: string; deals_done: number; committed_eur: number }[]).map((s) => [s.trip_id, { dealsDone: Number(s.deals_done) || 0, committedEur: Number(s.committed_eur) || 0 }]));
}

type TripRow = { id: string; origin: string; destination: string; travel_date: string; kg: number; per_kg: number; name?: string; rating?: number | null; rating_count?: number | null };
const toMatchTrip = (t: TripRow, stats: Stats): MatchTrip => ({
  id: t.id, origin: t.origin, destination: t.destination, travelDate: t.travel_date, kgFree: Number(t.kg), perKg: Number(t.per_kg),
  ratingAvg: t.rating === null || t.rating === undefined ? null : Number(t.rating), ratingCount: Number(t.rating_count) || 0,
  dealsDone: stats.get(t.id)?.dealsDone ?? 0, committedEur: stats.get(t.id)?.committedEur ?? 0,
});

/** Para quem envia: as viagens sugeridas para cada um dos seus pedidos abertos (top 3 por omissão). */
export async function suggestTripsForMyRequests(supabase: Supa, userId: string, today: string, limit = 3): Promise<Map<string, TripSuggestion[]>> {
  const { data: mine } = await supabase.from("requests").select("id, origin, destination, kg, offer, deadline, item_value").eq("user_id", userId).eq("status", "aberto");
  const reqs = (mine ?? []) as { id: string; origin: string; destination: string; kg: number; offer: number | null; deadline: string | null; item_value: number }[];
  if (!reqs.length) return new Map();
  const [{ data: pub }, { data: own }] = await Promise.all([
    supabase.from("trips_public").select("*").eq("status", "aberto").eq("example", false).gte("travel_date", today),
    supabase.from("trips").select("id").eq("user_id", userId),
  ]);
  const ownIds = new Set(((own ?? []) as { id: string }[]).map((t) => t.id));
  const trips = ((pub ?? []) as TripRow[]).filter((t) => !ownIds.has(t.id)); // nunca a própria viagem
  const stats = await tripStats(supabase, trips.map((t) => t.id));
  const matchTrips = trips.map((t) => toMatchTrip(t, stats));
  const byId = new Map(trips.map((t) => [t.id, t]));
  const out = new Map<string, TripSuggestion[]>();
  for (const r of reqs) {
    const mr: MatchRequest = { id: r.id, origin: r.origin, destination: r.destination, kg: Number(r.kg), offer: r.offer ?? null, valueEur: Number(r.item_value) || 0, deadline: r.deadline };
    out.set(r.id, rankTrips(mr, matchTrips, { today, limit }).map((m) => {
      const t = byId.get(m.tripId)!;
      return { match: m, trip: { id: t.id, travel_date: t.travel_date, kg: Number(t.kg), per_kg: Number(t.per_kg), name: t.name ?? "", rating: t.rating ?? null, rating_count: Number(t.rating_count) || 0 } };
    }));
  }
  return out;
}

/** Para quem viaja: os pedidos que cabem na mala de cada uma das suas viagens abertas (top 3 por omissão). */
export async function suggestRequestsForMyTrips(supabase: Supa, userId: string, today: string, limit = 3): Promise<Map<string, RequestSuggestion[]>> {
  const { data: mine } = await supabase.from("trips").select("id, origin, destination, travel_date, kg, per_kg").eq("user_id", userId).eq("status", "aberto").gte("travel_date", today);
  const trips = (mine ?? []) as TripRow[];
  if (!trips.length) return new Map();
  const ids = trips.map((t) => t.id);
  const [{ data: rated }, stats, open] = await Promise.all([
    supabase.from("trips_public").select("id, rating, rating_count").in("id", ids),
    tripStats(supabase, ids),
    supabase.rpc("match_open_requests"),
  ]);
  if (open.error || !Array.isArray(open.data)) return new Map(); // matching.sql ainda não foi corrido
  const ratings = new Map(((rated ?? []) as { id: string; rating: number | null; rating_count: number }[]).map((r) => [r.id, r]));
  const rows = open.data as { id: string; origin: string; destination: string; item: string; category: string; kg: number; offer: number | null; deadline: string | null; name: string; value_eur: number }[];
  const reqs: MatchRequest[] = rows.map((r) => ({ id: r.id, origin: r.origin, destination: r.destination, kg: Number(r.kg), offer: r.offer ?? null, valueEur: Number(r.value_eur) || 0, deadline: r.deadline }));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out = new Map<string, RequestSuggestion[]>();
  for (const t of trips) {
    const mt = toMatchTrip({ ...t, rating: ratings.get(t.id)?.rating ?? null, rating_count: ratings.get(t.id)?.rating_count ?? 0 }, stats);
    out.set(t.id, rankRequests(mt, reqs, { today, limit }).map((m) => {
      const r = byId.get(m.requestId)!;
      return { match: m, req: { id: r.id, item: r.item, category: r.category, kg: Number(r.kg), offer: r.offer ?? null, deadline: r.deadline, name: r.name } };
    }));
  }
  return out;
}

/**
 * Para a equipa: o melhor par para cada pedido aberto, com os dados que a equipa já tem (sem ir outra vez à base de dados).
 * Nunca junta o pedido e a viagem da mesma pessoa. Os mais pontuados primeiro.
 */
export function teamSuggestions(reqs: Req[], trips: Trip[], deals: Deal[], ratings: Map<string, { rating: number | null; rating_count: number }>, today: string, limit = 12): TeamSuggestion[] {
  const valueOf = new Map(reqs.map((r) => [r.id, Number(r.item_value) || 0]));
  const committed = new Map<string, number>();
  const done = new Map<string, number>();
  for (const d of deals) {
    if (d.trip_id && d.status !== "cancelado") committed.set(d.trip_id, (committed.get(d.trip_id) ?? 0) + (d.request_id ? valueOf.get(d.request_id) ?? 0 : 0));
    if (d.traveler_id && (d.status === "entregue" || d.status === "liberado")) done.set(d.traveler_id, (done.get(d.traveler_id) ?? 0) + 1);
  }
  const openTrips = trips.filter((t) => t.status === "aberto" && !t.example && t.travel_date >= today);
  const out: TeamSuggestion[] = [];
  for (const r of reqs.filter((x) => x.status === "aberto" && !x.example)) {
    const candidates = openTrips.filter((t) => t.user_id !== r.user_id);
    const mts: MatchTrip[] = candidates.map((t) => ({
      id: t.id, origin: t.origin, destination: t.destination, travelDate: t.travel_date, kgFree: Number(t.kg), perKg: Number(t.per_kg),
      ratingAvg: ratings.get(t.id)?.rating ?? null, ratingCount: ratings.get(t.id)?.rating_count ?? 0,
      dealsDone: done.get(t.user_id) ?? 0, committedEur: committed.get(t.id) ?? 0,
    }));
    const best = rankTrips({ id: r.id, origin: r.origin, destination: r.destination, kg: Number(r.kg), offer: r.offer ?? null, valueEur: Number(r.item_value) || 0, deadline: r.deadline }, mts, { today, limit: 1 })[0];
    if (best) out.push({ match: best, req: r, trip: candidates.find((t) => t.id === best.tripId)! });
  }
  return out.sort((a, b) => b.match.score - a.match.score).slice(0, limit);
}
