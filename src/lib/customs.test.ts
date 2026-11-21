import { describe, expect, it } from "vitest";
import { CATS } from "./constants";
import { MAX_TRIP_EUR, customsEstimate, needsInvoice, routeMatches } from "./customs";

describe("alfândega: teto e imposto estimado", () => {
  it("o teto por viagem em euros vem do teto em kwanzas", () => expect(MAX_TRIP_EUR).toBe(1363));
  it("até ao teto é a taxa forfetária de 16%", () => {
    const e = customsEstimate(1363);
    expect(e.kind).toBe("forfetario");
    if (e.kind === "forfetario") expect(e.taxKz).toBe(Math.round((1363 * 1100 * 16) / 100));
  });
  it("acima do teto é o regime geral, e a Kamba não aceita", () => expect(customsEstimate(1364).kind).toBe("geral"));
  it("valor negativo conta como zero", () => expect(customsEstimate(-10).valueKz).toBe(0));
});

describe("fatura da compra", () => {
  it("é exigida a partir de 300 €, em qualquer categoria", () => {
    expect(needsInvoice(CATS[0], 299)).toBe(false);
    expect(needsInvoice(CATS[0], 300)).toBe(true);
  });
  it("é sempre exigida nos bens de risco, mesmo baratos", () => {
    for (const i of [1, 2, 3]) expect(needsInvoice(CATS[i], 10), CATS[i]).toBe(true);
  });
  it("medicamentos não existem como categoria", () => expect(CATS.some((c) => /medicament/i.test(c))).toBe(false));
});

describe("rota de pedidos e viagens", () => {
  it("encaixam com a mesma origem e destino, ou com «outra cidade»", () => {
    expect(routeMatches({ origin: "LIS", destination: "LAD" }, { origin: "LIS", destination: "LAD" })).toBe(true);
    expect(routeMatches({ origin: "OTH", destination: "LAD" }, { origin: "LIS", destination: "LAD" })).toBe(true);
    expect(routeMatches({ origin: "LIS", destination: "LAD" }, { origin: "OPO", destination: "LAD" })).toBe(false);
  });
});
