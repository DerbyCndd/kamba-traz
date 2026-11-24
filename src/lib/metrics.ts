/**
 * Métricas do piloto, a partir da tabela de eventos (metricas.sql). Os eventos não têm dados pessoais:
 * só o tipo, o pedido (subject_id), a viagem (ref_id, quando há par) e a hora.
 */
export const EVENT_KINDS = ["pedido_publicado", "viagem_publicada", "sugestao_mostrada", "proposta_feita", "acordo", "entrega_concluida"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
export type PilotEvent = { kind: EventKind; subject_id: string; ref_id: string | null; at: string };

export type PilotMetrics = {
  requests: number;
  trips: number;
  agreements: number;
  /** Tempo médio, em horas, entre o pedido publicado e o acordo (só pedidos com os dois eventos). */
  avgHoursToAgreement: number | null;
  /** Percentagem de pedidos publicados a quem foi mostrada pelo menos uma sugestão (0–100). */
  requestsWithSuggestionPct: number | null;
  /** Percentagem de pares sugeridos (pedido + viagem) que viraram acordo com essa mesma viagem (0–100). */
  suggestionToAgreementPct: number | null;
  deliveriesDone: number;
  avgRating: number | null;
};

const pair = (e: PilotEvent) => `${e.subject_id}|${e.ref_id ?? ""}`;
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);

export function computeMetrics(events: PilotEvent[], ratings: number[]): PilotMetrics {
  const of = (k: EventKind) => events.filter((e) => e.kind === k);
  const published = new Map<string, number>();
  for (const e of of("pedido_publicado")) {
    const t = Date.parse(e.at);
    if (!published.has(e.subject_id) || t < published.get(e.subject_id)!) published.set(e.subject_id, t);
  }
  // Primeiro acordo de cada pedido
  const firstDeal = new Map<string, number>();
  for (const e of of("acordo")) {
    const t = Date.parse(e.at);
    if (!firstDeal.has(e.subject_id) || t < firstDeal.get(e.subject_id)!) firstDeal.set(e.subject_id, t);
  }
  const waits = [...firstDeal].filter(([id, t]) => published.has(id) && t >= published.get(id)!).map(([id, t]) => (t - published.get(id)!) / 3_600_000);

  const suggested = new Set(of("sugestao_mostrada").map(pair));
  const suggestedReqs = new Set(of("sugestao_mostrada").map((e) => e.subject_id));
  const dealPairs = new Set(of("acordo").map(pair));
  const converted = [...suggested].filter((p) => dealPairs.has(p)).length;
  const valid = ratings.filter((r) => r >= 1 && r <= 5);

  return {
    requests: published.size,
    trips: new Set(of("viagem_publicada").map((e) => e.subject_id)).size,
    agreements: firstDeal.size,
    avgHoursToAgreement: waits.length ? Math.round((waits.reduce((a, b) => a + b, 0) / waits.length) * 10) / 10 : null,
    requestsWithSuggestionPct: pctOf([...suggestedReqs].filter((id) => published.has(id)).length, published.size),
    suggestionToAgreementPct: pctOf(converted, suggested.size),
    deliveriesDone: new Set(of("entrega_concluida").map((e) => e.subject_id)).size,
    avgRating: valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : null,
  };
}

/** «2,5 dias» / «5 h» / «–». */
export function fmtWait(hours: number | null): string {
  if (hours === null) return "–";
  if (hours < 48) return `${String(Math.round(hours * 10) / 10).replace(".", ",")} h`;
  return `${String(Math.round((hours / 24) * 10) / 10).replace(".", ",")} dias`;
}

const csvCell = (v: string | number | null) => {
  const s = v === null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV com o resumo e os eventos (sem dados pessoais). Separador vírgula, UTF-8 com BOM para abrir bem no Excel. */
export function metricsCsv(m: PilotMetrics, events: PilotEvent[]): string {
  const lines: (string | number | null)[][] = [
    ["metrica", "valor"],
    ["pedidos_publicados", m.requests],
    ["viagens_publicadas", m.trips],
    ["acordos", m.agreements],
    ["horas_medias_ate_acordo", m.avgHoursToAgreement],
    ["pct_pedidos_com_sugestao", m.requestsWithSuggestionPct],
    ["pct_sugestoes_em_acordo", m.suggestionToAgreementPct],
    ["entregas_concluidas", m.deliveriesDone],
    ["avaliacao_media", m.avgRating],
    [],
    ["evento", "pedido_ou_entrega", "viagem", "quando"],
    ...events.map((e) => [e.kind, e.subject_id, e.ref_id, e.at]),
  ];
  return "﻿" + lines.map((l) => l.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
