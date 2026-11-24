import { describe, expect, it } from "vitest";
import { computeMetrics, fmtWait, metricsCsv, type PilotEvent } from "./metrics";

const ev = (kind: PilotEvent["kind"], subject_id: string, at: string, ref_id: string | null = null): PilotEvent => ({ kind, subject_id, ref_id, at });

const events: PilotEvent[] = [
  ev("pedido_publicado", "r1", "2026-11-01T10:00:00Z"),
  ev("pedido_publicado", "r2", "2026-11-02T10:00:00Z"),
  ev("pedido_publicado", "r3", "2026-11-03T10:00:00Z"),
  ev("pedido_publicado", "r4", "2026-11-04T10:00:00Z"),
  ev("viagem_publicada", "t1", "2026-11-01T09:00:00Z"),
  ev("viagem_publicada", "t2", "2026-11-01T09:00:00Z"),
  ev("sugestao_mostrada", "r1", "2026-11-01T11:00:00Z", "t1"),
  ev("sugestao_mostrada", "r1", "2026-11-01T11:00:00Z", "t2"),
  ev("sugestao_mostrada", "r2", "2026-11-02T11:00:00Z", "t1"),
  ev("proposta_feita", "r1", "2026-11-01T12:00:00Z", "t1"),
  ev("acordo", "r1", "2026-11-02T10:00:00Z", "t1"), // 24 h depois, par sugerido
  ev("acordo", "r3", "2026-11-04T22:00:00Z", "t2"), // 36 h depois, sem sugestão
  ev("entrega_concluida", "d1", "2026-11-10T10:00:00Z"),
];

describe("métricas do piloto", () => {
  const m = computeMetrics(events, [5, 4, 5, 0]);
  it("conta pedidos, viagens, acordos e entregas", () => {
    expect([m.requests, m.trips, m.agreements, m.deliveriesDone]).toEqual([4, 2, 2, 1]);
  });
  it("tempo médio até ao acordo, em horas", () => expect(m.avgHoursToAgreement).toBe(30));
  it("percentagem de pedidos com sugestão", () => expect(m.requestsWithSuggestionPct).toBe(50));
  it("percentagem de sugestões (pares) que viraram acordo", () => expect(m.suggestionToAgreementPct).toBe(33.3));
  it("avaliação média ignora valores inválidos", () => expect(m.avgRating).toBe(4.7));
  it("sem dados não inventa números", () => {
    expect(computeMetrics([], [])).toEqual({ requests: 0, trips: 0, agreements: 0, avgHoursToAgreement: null, requestsWithSuggestionPct: null, suggestionToAgreementPct: null, deliveriesDone: 0, avgRating: null });
  });
  it("só conta o primeiro acordo de cada pedido", () => {
    const x = computeMetrics([...events, ev("acordo", "r1", "2026-11-09T10:00:00Z", "t2")], []);
    expect(x.agreements).toBe(2);
    expect(x.avgHoursToAgreement).toBe(30);
  });
});

describe("formatos", () => {
  it("tempo de espera legível", () => {
    expect(fmtWait(null)).toBe("–");
    expect(fmtWait(5.25)).toBe("5,3 h");
    expect(fmtWait(60)).toBe("2,5 dias");
  });
  it("CSV com resumo e eventos, sem nomes nem contactos", () => {
    const csv = metricsCsv(computeMetrics(events, [5]), events);
    expect(csv.startsWith("﻿metrica,valor\r\n")).toBe(true);
    expect(csv).toContain("horas_medias_ate_acordo,30");
    expect(csv).toContain("sugestao_mostrada,r1,t1,2026-11-01T11:00:00Z");
    expect(csv.trim().split("\r\n")).toHaveLength(10 + 1 + events.length);
  });
});
