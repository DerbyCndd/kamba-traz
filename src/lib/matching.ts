import { customsEstimate } from "./customs";

/**
 * Emparelhamento automático entre pedidos de envio e viagens confirmadas.
 *
 * Função pura: recebe dados e a data de hoje, devolve as combinações compatíveis ordenadas por pontuação (0 a 100),
 * cada uma com a explicação em português. Não mostra contactos nem toca na base de dados.
 *
 * Filtros obrigatórios (fora de um deles, a combinação nem aparece):
 *  1. mesma origem e mesmo destino (igualdade exata: «outra cidade» não serve de coringa);
 *  2. a data da viagem cai na janela do pedido: de hoje até ao prazo («preciso até»), ou 90 dias se não houver prazo;
 *  3. a viagem tem quilos livres para o pedido;
 *  4. o valor das mercadorias já na viagem, somado ao deste pedido, não passa o limite da alfândega (customs.ts).
 */

/** Quanto pesa cada critério na pontuação. A soma é 100, mas qualquer soma serve: normaliza-se. */
export const MATCH_WEIGHTS = { date: 30, spare: 15, rating: 25, deals: 10, price: 20 } as const;
export type MatchWeights = { [K in keyof typeof MATCH_WEIGHTS]: number };

/** Janela por omissão (dias a partir de hoje) para pedidos sem prazo. */
export const DEFAULT_WINDOW_DAYS = 90;
/** Viajar com menos de 2 dias de margem antes do prazo é arriscado: a nota da data desce. */
export const MIN_COMFORT_DAYS = 2;
/** Entregas concluídas a partir das quais a nota «experiência» é máxima. */
export const DEALS_FOR_FULL_SCORE = 10;
/** Avaliações que contam como «confiança total» na média (menos do que isto, a média encolhe para o neutro). */
export const RATING_CONFIDENCE = 3;

export type MatchRequest = {
  id: string; origin: string; destination: string;
  kg: number;
  /** Oferta total pelo transporte, em Kz (null se não houver). */
  offer: number | null;
  /** Valor do item, em euros. */
  valueEur: number;
  /** «Preciso até» (AAAA-MM-DD) ou null. */
  deadline: string | null;
};

export type MatchTrip = {
  id: string; origin: string; destination: string;
  /** Data da viagem (AAAA-MM-DD). */
  travelDate: string;
  /** Quilos livres. */
  kgFree: number;
  /** Preço por kg, em Kz. */
  perKg: number;
  ratingAvg: number | null; ratingCount: number;
  /** Entregas concluídas por quem viaja. */
  dealsDone: number;
  /** Valor, em euros, das mercadorias que a viagem já leva (entregas não canceladas). */
  committedEur: number;
};

export type Match = {
  requestId: string; tripId: string;
  /** 0 a 100. */
  score: number;
  /** Cada razão, curta. */
  reasons: string[];
  /** As razões juntas: «mesma rota, 3 dias antes do prazo, avaliação 4,8». */
  explanation: string;
};

export type MatchOptions = { today: string; weights?: MatchWeights; limit?: number };

const DAY_MS = 86_400_000;
const toDay = (iso: string) => Date.parse(iso.slice(0, 10) + "T12:00:00Z");
/** Dias inteiros de uma data à outra (negativo se a segunda for anterior). */
export const daysBetween = (fromIso: string, toIso: string) => Math.round((toDay(toIso) - toDay(fromIso)) / DAY_MS);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const avgPt = (n: number) => n.toFixed(1).replace(".", ",");
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Avalia um pedido contra uma viagem. null se um filtro obrigatório falha. */
export function scorePair(request: MatchRequest, trip: MatchTrip, opts: MatchOptions): Match | null {
  const w = opts.weights ?? MATCH_WEIGHTS;
  if (!(request.kg > 0) || !Number.isFinite(trip.kgFree)) return null;

  // 1) Rota
  if (request.origin !== trip.origin || request.destination !== trip.destination) return null;

  // 2) Janela de datas
  const fromToday = daysBetween(opts.today, trip.travelDate);
  if (!Number.isFinite(fromToday) || fromToday < 0) return null; // a viagem já passou
  const windowDays = Math.max(1, request.deadline ? daysBetween(opts.today, request.deadline) : DEFAULT_WINDOW_DAYS);
  if (fromToday > windowDays) return null;
  const margin = request.deadline ? daysBetween(trip.travelDate, request.deadline) : null; // dias entre a viagem e o prazo

  // 3) Quilos
  if (trip.kgFree < request.kg) return null;

  // 4) Alfândega: o valor total da viagem com este pedido não passa o limite
  if (customsEstimate(trip.committedEur + request.valueEur).kind === "geral") return null;

  // Pontuação, cada critério de 0 a 1
  let date = 1 - clamp01(fromToday / windowDays); // quanto mais cedo, melhor
  if (margin !== null && margin < MIN_COMFORT_DAYS) date *= 0.7; // à justa do prazo
  const ratio = trip.kgFree / request.kg;
  const spare = 0.5 + 0.5 * clamp01(ratio - 1); // cabe à justa = 0,5; com o dobro de espaço = 1
  const shrink = trip.ratingCount / (trip.ratingCount + RATING_CONFIDENCE);
  const stars = trip.ratingAvg !== null && trip.ratingCount > 0 ? clamp01((trip.ratingAvg - 1) / 4) : 0.5;
  const rating = 0.5 + (stars - 0.5) * shrink; // sem avaliações = neutro (não castiga quem começa)
  const deals = clamp01(trip.dealsDone / DEALS_FOR_FULL_SCORE);
  const cost = trip.perKg * request.kg;
  const price = request.offer && request.offer > 0 ? (cost <= request.offer ? 1 : clamp01(request.offer / cost)) : 0.5;

  const total = w.date + w.spare + w.rating + w.deals + w.price || 1;
  const score = Math.round(((w.date * date + w.spare * spare + w.rating * rating + w.deals * deals + w.price * price) / total) * 100);

  const reasons = ["mesma rota"];
  if (margin !== null) reasons.push(margin === 0 ? "no último dia do prazo" : `${margin} ${plural(margin, "dia", "dias")} antes do prazo`);
  else reasons.push(fromToday === 0 ? "viaja hoje" : fromToday === 1 ? "viaja amanhã" : `viaja daqui a ${fromToday} dias`);
  if (ratio >= 2) reasons.push(`mala com folga (${trip.kgFree} kg livres)`);
  else if (ratio < 1.25) reasons.push("cabe à justa");
  reasons.push(trip.ratingCount > 0 && trip.ratingAvg !== null ? `avaliação ${avgPt(trip.ratingAvg)}` : "sem avaliações ainda");
  if (trip.dealsDone > 0) reasons.push(`${trip.dealsDone} ${plural(trip.dealsDone, "entrega concluída", "entregas concluídas")}`);
  if (request.offer && request.offer > 0) reasons.push(cost <= request.offer ? "preço dentro da oferta" : "preço acima da oferta");

  return { requestId: request.id, tripId: trip.id, score, reasons, explanation: reasons.join(", ") };
}

/** Desempate estável: mais pontos, depois a viagem mais cedo, depois a melhor avaliação, depois o identificador. */
const byTrip = (trips: Map<string, MatchTrip>) => (a: Match, b: Match) => {
  const ta = trips.get(a.tripId)!, tb = trips.get(b.tripId)!;
  return b.score - a.score || ta.travelDate.localeCompare(tb.travelDate) || (tb.ratingAvg ?? 0) - (ta.ratingAvg ?? 0) || a.tripId.localeCompare(b.tripId);
};
const byRequest = (reqs: Map<string, MatchRequest>) => (a: Match, b: Match) => {
  const ra = reqs.get(a.requestId)!, rb = reqs.get(b.requestId)!;
  return b.score - a.score || (ra.deadline ?? "9999-12-31").localeCompare(rb.deadline ?? "9999-12-31") || (rb.offer ?? 0) - (ra.offer ?? 0) || a.requestId.localeCompare(b.requestId);
};

/** As viagens compatíveis com um pedido, da melhor para a pior. */
export function rankTrips(request: MatchRequest, trips: MatchTrip[], opts: MatchOptions): Match[] {
  const found = trips.map((t) => scorePair(request, t, opts)).filter((m): m is Match => m !== null);
  const sorted = found.sort(byTrip(new Map(trips.map((t) => [t.id, t]))));
  return opts.limit ? sorted.slice(0, opts.limit) : sorted;
}

/** Os pedidos que cabem na mala de uma viagem, do melhor para o pior. */
export function rankRequests(trip: MatchTrip, requests: MatchRequest[], opts: MatchOptions): Match[] {
  const found = requests.map((r) => scorePair(r, trip, opts)).filter((m): m is Match => m !== null);
  const sorted = found.sort(byRequest(new Map(requests.map((r) => [r.id, r]))));
  return opts.limit ? sorted.slice(0, opts.limit) : sorted;
}
