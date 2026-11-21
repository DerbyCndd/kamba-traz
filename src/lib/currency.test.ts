import { describe, expect, it } from "vitest";
import { CURRENCIES, ORIGIN_CURRENCY, isCur, toEur } from "./currency";

describe("conversão para euros", () => {
  it("euros ficam iguais, arredondados para cima ao euro", () => {
    expect(toEur(100, "EUR")).toBe(100);
    expect(toEur(100.2, "EUR")).toBe(101);
  });
  it("converte as outras moedas com a taxa de referência, sempre para cima", () => {
    expect(toEur(1000, "BRL")).toBe(162); // 1000 / 6,2 = 161,29
    expect(toEur(100, "GBP")).toBe(121); // 100 / 0,83 = 120,48
  });
  it("valores inválidos dão zero", () => {
    expect(toEur(0, "BRL")).toBe(0);
    expect(toEur(-5, "GBP")).toBe(0);
    expect(toEur(Number.NaN, "GBP")).toBe(0);
  });
  it("só aceita moedas da lista, e nunca chaves herdadas do objeto", () => {
    expect(isCur("BRL")).toBe(true);
    expect(isCur("XXX")).toBe(false);
    expect(isCur("constructor")).toBe(false);
    expect(isCur(undefined)).toBe(false);
  });
  it("todas as cidades de origem têm uma moeda válida", () => {
    for (const cur of Object.values(ORIGIN_CURRENCY)) expect(cur in CURRENCIES).toBe(true);
  });
});
