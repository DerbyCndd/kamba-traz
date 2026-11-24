import { describe, expect, it } from "vitest";
import { DEAL_FLOW, DEAL_LABEL, canTransition, codeAllowed, nextStatus, statusEmail } from "./deal-flow";

describe("caminho da entrega", () => {
  it("segue a ordem acordo → retido → recolhido → em viagem → entregue → libertado", () => {
    expect(DEAL_FLOW.map((s) => DEAL_LABEL[s])).toEqual(["Acordo", "Pagamento retido", "Recolhido", "Em viagem", "Entregue", "Libertado"]);
    expect(nextStatus("garantia")).toBe("recolhido");
    expect(nextStatus("liberado")).toBeNull();
    expect(nextStatus("cancelado")).toBeNull();
  });
  it("cada passo é feito por quem deve", () => {
    expect(canTransition("negociacao", "garantia", "equipa")).toBe(true);
    expect(canTransition("negociacao", "garantia", "viajante")).toBe(false);
    expect(canTransition("garantia", "recolhido", "viajante")).toBe(true);
    expect(canTransition("recolhido", "transito", "viajante")).toBe(true);
    expect(canTransition("transito", "entregue", "viajante")).toBe(true);
    expect(canTransition("entregue", "liberado", "equipa")).toBe(true);
    expect(canTransition("entregue", "liberado", "viajante")).toBe(false);
  });
  it("não salta passos nem volta atrás", () => {
    expect(canTransition("garantia", "transito", "viajante")).toBe(false);
    expect(canTransition("negociacao", "liberado", "equipa")).toBe(false);
    expect(canTransition("transito", "garantia", "equipa")).toBe(false);
    expect(canTransition("garantia", "garantia", "equipa")).toBe(false);
    expect(canTransition("garantia", "inventado", "equipa")).toBe(false);
  });
  it("só a equipa cancela, e só antes da entrega", () => {
    expect(canTransition("transito", "cancelado", "equipa")).toBe(true);
    expect(canTransition("transito", "cancelado", "viajante")).toBe(false);
    expect(canTransition("entregue", "cancelado", "equipa")).toBe(false);
    expect(canTransition("liberado", "cancelado", "equipa")).toBe(false);
  });
  it("o código só se gera entre o pagamento retido e a entrega", () => {
    expect(["negociacao", "garantia", "recolhido", "transito", "entregue"].map(codeAllowed)).toEqual([false, true, true, true, false]);
  });
  it("o email diz o estado sem dados pessoais", () => {
    const m = statusEmail("recolhido", "Telemóvel", "KT-AB12", "https://exemplo/entregas/1");
    expect(m.subject).toBe("Kamba Traz KT-AB12: Recolhido");
    expect(m.text).toContain("recolheu a encomenda");
    expect(m.text).not.toMatch(/@|\+244|\+351/);
  });
});
