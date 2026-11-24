import { describe, expect, it } from "vitest";
import { CUSTOMS } from "./customs";
import { MATCH_WEIGHTS, daysBetween, rankRequests, rankTrips, scorePair, type MatchRequest, type MatchTrip } from "./matching";

const TODAY = "2026-12-01";
const opts = { today: TODAY };

const req = (o: Partial<MatchRequest> = {}): MatchRequest => ({
  id: "r1", origin: "LIS", destination: "LAD", kg: 4, offer: 40_000, valueEur: 100, deadline: "2026-12-20", ...o,
});
const trip = (o: Partial<MatchTrip> = {}): MatchTrip => ({
  id: "t1", origin: "LIS", destination: "LAD", travelDate: "2026-12-17", kgFree: 10, perKg: 8_000,
  ratingAvg: 4.8, ratingCount: 5, dealsDone: 3, committedEur: 0, ...o,
});

describe("filtros obrigatórios", () => {
  it("aceita uma combinação normal", () => expect(scorePair(req(), trip(), opts)).not.toBeNull());

  it("recusa rota diferente (origem ou destino)", () => {
    expect(scorePair(req(), trip({ origin: "OPO" }), opts)).toBeNull();
    expect(scorePair(req(), trip({ destination: "BUG" }), opts)).toBeNull();
  });
  it("«outra cidade» não serve de coringa", () => expect(scorePair(req({ origin: "OTH" }), trip(), opts)).toBeNull());

  it("recusa peso a mais, mas aceita quando cabe exatamente", () => {
    expect(scorePair(req({ kg: 11 }), trip({ kgFree: 10 }), opts)).toBeNull();
    expect(scorePair(req({ kg: 10 }), trip({ kgFree: 10 }), opts)).not.toBeNull();
  });

  it("recusa viagens fora da janela de datas: depois do prazo ou já passadas", () => {
    expect(scorePair(req({ deadline: "2026-12-20" }), trip({ travelDate: "2026-12-21" }), opts)).toBeNull();
    expect(scorePair(req(), trip({ travelDate: "2026-11-30" }), opts)).toBeNull();
    expect(scorePair(req({ deadline: "2026-12-20" }), trip({ travelDate: "2026-12-20" }), opts)).not.toBeNull(); // no último dia ainda serve
  });
  it("sem prazo, a janela é de 90 dias", () => {
    expect(scorePair(req({ deadline: null }), trip({ travelDate: "2027-02-28" }), opts)).not.toBeNull(); // 89 dias
    expect(scorePair(req({ deadline: null }), trip({ travelDate: "2027-03-05" }), opts)).toBeNull(); // 94 dias
  });

  it("recusa quando o valor total passa o limite da alfândega", () => {
    const limiteEur = Math.floor(CUSTOMS.flatMaxKz / CUSTOMS.eurKz); // 1363
    expect(scorePair(req({ valueEur: 100 }), trip({ committedEur: limiteEur - 100 }), opts)).not.toBeNull(); // chega ao limite, não passa
    expect(scorePair(req({ valueEur: 101 }), trip({ committedEur: limiteEur - 100 }), opts)).toBeNull(); // passa por 1 €
    expect(scorePair(req({ valueEur: limiteEur + 1 }), trip(), opts)).toBeNull(); // sozinho já passa
  });

  it("recusa dados inválidos", () => {
    expect(scorePair(req({ kg: 0 }), trip(), opts)).toBeNull();
    expect(scorePair(req(), trip({ kgFree: Number.NaN }), opts)).toBeNull();
  });
});

describe("pontuação", () => {
  it("fica sempre entre 0 e 100", () => {
    for (const t of [trip(), trip({ ratingAvg: 1, ratingCount: 50, dealsDone: 0, perKg: 99_999, kgFree: 4 }), trip({ ratingAvg: 5, ratingCount: 50, dealsDone: 99, perKg: 1 })]) {
      const m = scorePair(req(), t, opts)!;
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
    }
  });
  it("viajar mais cedo pontua mais", () => {
    const cedo = scorePair(req(), trip({ travelDate: "2026-12-05" }), opts)!.score;
    const tarde = scorePair(req(), trip({ travelDate: "2026-12-17" }), opts)!.score;
    expect(cedo).toBeGreaterThan(tarde);
  });
  it("viajar em cima do prazo desce a nota da data", () => {
    const folga = scorePair(req({ deadline: "2026-12-20" }), trip({ travelDate: "2026-12-17" }), opts)!.score;
    const aoLimite = scorePair(req({ deadline: "2026-12-18" }), trip({ travelDate: "2026-12-18" }), opts)!.score;
    expect(aoLimite).toBeLessThan(folga);
  });
  it("mais folga na mala pontua mais", () => {
    expect(scorePair(req(), trip({ kgFree: 20 }), opts)!.score).toBeGreaterThan(scorePair(req(), trip({ kgFree: 4 }), opts)!.score);
  });
  it("melhor avaliação e mais entregas pontuam mais", () => {
    expect(scorePair(req(), trip({ ratingAvg: 5, ratingCount: 10 }), opts)!.score).toBeGreaterThan(scorePair(req(), trip({ ratingAvg: 3, ratingCount: 10 }), opts)!.score);
    expect(scorePair(req(), trip({ dealsDone: 10 }), opts)!.score).toBeGreaterThan(scorePair(req(), trip({ dealsDone: 0 }), opts)!.score);
  });
  it("quem ainda não tem avaliações fica no neutro, não é castigado", () => {
    const semNada = scorePair(req(), trip({ ratingAvg: null, ratingCount: 0 }), opts)!.score;
    const mediana = scorePair(req(), trip({ ratingAvg: 3, ratingCount: 10 }), opts)!.score; // 3 estrelas = meio da escala
    expect(Math.abs(semNada - mediana)).toBeLessThanOrEqual(1);
  });
  it("uma só avaliação não chega para dominar", () => {
    const uma = scorePair(req(), trip({ ratingAvg: 5, ratingCount: 1 }), opts)!.score;
    const muitas = scorePair(req(), trip({ ratingAvg: 5, ratingCount: 30 }), opts)!.score;
    expect(muitas).toBeGreaterThan(uma);
  });
  it("preço acima da oferta pontua menos do que dentro da oferta", () => {
    const dentro = scorePair(req({ offer: 40_000 }), trip({ perKg: 8_000 }), opts)!.score; // custo 32 000
    const acima = scorePair(req({ offer: 40_000 }), trip({ perKg: 15_000 }), opts)!.score; // custo 60 000
    expect(dentro).toBeGreaterThan(acima);
  });
  it("os pesos somam 100", () => expect(Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100));
  it("aceita pesos diferentes", () => {
    const soData = { date: 1, spare: 0, rating: 0, deals: 0, price: 0 };
    const m = scorePair(req(), trip({ travelDate: TODAY }), { ...opts, weights: soData })!;
    expect(m.score).toBeGreaterThanOrEqual(99);
  });
});

describe("explicação", () => {
  it("diz a rota, a margem para o prazo e a avaliação", () => {
    const m = scorePair(req({ deadline: "2026-12-20" }), trip({ travelDate: "2026-12-17", ratingAvg: 4.8 }), opts)!;
    expect(m.explanation).toContain("mesma rota");
    expect(m.explanation).toContain("3 dias antes do prazo");
    expect(m.explanation).toContain("avaliação 4,8");
  });
  it("sem prazo, diz quantos dias faltam", () => {
    expect(scorePair(req({ deadline: null }), trip({ travelDate: "2026-12-11" }), opts)!.explanation).toContain("viaja daqui a 10 dias");
  });
  it("diz «sem avaliações ainda» e usa o singular", () => {
    const m = scorePair(req({ deadline: "2026-12-18" }), trip({ travelDate: "2026-12-17", ratingAvg: null, ratingCount: 0, dealsDone: 1 }), opts)!;
    expect(m.explanation).toContain("1 dia antes do prazo");
    expect(m.explanation).toContain("sem avaliações ainda");
    expect(m.explanation).toContain("1 entrega concluída");
  });
});

describe("ordenação", () => {
  it("devolve só as compatíveis, da melhor para a pior", () => {
    const trips = [
      trip({ id: "longe", origin: "OPO" }),
      trip({ id: "boa", ratingAvg: 5, ratingCount: 20, dealsDone: 10, travelDate: "2026-12-05" }),
      trip({ id: "fraca", ratingAvg: 2, ratingCount: 20, dealsDone: 0, travelDate: "2026-12-19", kgFree: 4 }),
      trip({ id: "pesada", kgFree: 1 }),
    ];
    const r = rankTrips(req(), trips, opts);
    expect(r.map((m) => m.tripId)).toEqual(["boa", "fraca"]);
    expect(r[0].score).toBeGreaterThan(r[1].score);
  });
  it("respeita o limite de resultados (o top 3)", () => {
    const trips = ["a", "b", "c", "d", "e"].map((id, i) => trip({ id, travelDate: `2026-12-0${i + 2}` }));
    expect(rankTrips(req(), trips, { ...opts, limit: 3 })).toHaveLength(3);
  });
  it("empate de pontuação: a viagem mais cedo ganha, e depois o identificador, sempre pela mesma ordem", () => {
    const a = trip({ id: "b-viagem", travelDate: "2026-12-10" });
    const b = trip({ id: "a-viagem", travelDate: "2026-12-10" });
    const c = trip({ id: "c-viagem", travelDate: "2026-12-10" });
    const r1 = rankTrips(req({ deadline: null }), [a, b, c], opts);
    const r2 = rankTrips(req({ deadline: null }), [c, a, b], opts); // outra ordem de entrada
    expect(new Set(r1.map((m) => m.score)).size).toBe(1); // mesmo score: é mesmo um empate
    expect(r1.map((m) => m.tripId)).toEqual(["a-viagem", "b-viagem", "c-viagem"]);
    expect(r2.map((m) => m.tripId)).toEqual(r1.map((m) => m.tripId));
  });
  it("empate de pontuação com datas diferentes mas igual score: ganha a mais cedo", () => {
    const pesos = { date: 0, spare: 1, rating: 0, deals: 0, price: 0 }; // só conta o espaço: datas não mexem na nota
    const tarde = trip({ id: "tarde", travelDate: "2026-12-18" });
    const cedo = trip({ id: "cedo", travelDate: "2026-12-06" });
    const r = rankTrips(req(), [tarde, cedo], { ...opts, weights: pesos });
    expect(r[0].score).toBe(r[1].score);
    expect(r.map((m) => m.tripId)).toEqual(["cedo", "tarde"]);
  });
  it("do lado da viagem: os pedidos que cabem na mala, com o mesmo critério", () => {
    const t = trip({ kgFree: 5 });
    const pedidos = [
      req({ id: "cabe", kg: 3 }),
      req({ id: "pesado", kg: 9 }),
      req({ id: "outra-rota", destination: "BUG" }),
      req({ id: "caro", valueEur: 5_000 }),
      req({ id: "fora-do-prazo", deadline: "2026-12-10" }),
    ];
    expect(rankRequests(t, pedidos, opts).map((m) => m.requestId)).toEqual(["cabe"]);
  });
  it("empate do lado da viagem: o prazo mais próximo ganha", () => {
    const t = trip();
    const r = rankRequests(t, [req({ id: "x", deadline: "2026-12-28" }), req({ id: "y", deadline: "2026-12-26" })], { ...opts, weights: { date: 0, spare: 1, rating: 0, deals: 0, price: 0 } });
    expect(r[0].score).toBe(r[1].score);
    expect(r.map((m) => m.requestId)).toEqual(["y", "x"]);
  });
});

describe("datas", () => {
  it("conta dias inteiros", () => {
    expect(daysBetween("2026-12-01", "2026-12-04")).toBe(3);
    expect(daysBetween("2026-12-04", "2026-12-01")).toBe(-3);
    expect(daysBetween("2026-12-01", "2026-12-01")).toBe(0);
  });
  it("atravessa a mudança de hora sem perder um dia", () => expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2));
});
