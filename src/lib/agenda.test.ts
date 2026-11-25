import { describe, expect, it } from "vitest";
import { buildAgenda, type AgendaInput } from "./agenda";

const base: AgendaInput = { userId: "me", deals: [], offersWaiting: 0, ratings: [], missingLevel1: [], refOf: (id) => "KT-" + id.toUpperCase() };

describe("o que precisa de ti agora", () => {
  it("vazio quando não há nada", () => expect(buildAgenda(base)).toEqual([]));
  it("quem leva vê o passo seguinte de cada entrega", () => {
    const a = buildAgenda({ ...base, deals: [
      { id: "a", label: "Livros", status: "garantia", traveler_id: "me", sender_id: "x" },
      { id: "b", label: "Roupa", status: "recolhido", traveler_id: "me", sender_id: "x" },
      { id: "c", label: "Telemóvel", status: "transito", traveler_id: "me", sender_id: "x" },
    ] });
    expect(a.map((x) => [x.ref, x.cta])).toEqual([["KT-A", "Recolher"], ["KT-B", "Estou em viagem"], ["KT-C", "Confirmar entrega"]]);
    expect(a.every((x) => x.tone === "now" && x.href.startsWith("/entregas/"))).toBe(true);
  });
  it("quem envia gera o código com o pagamento retido, e depois só acompanha", () => {
    const a = buildAgenda({ ...base, deals: [
      { id: "a", label: "Livros", status: "transito", sender_id: "me", traveler_id: "x" },
      { id: "b", label: "Roupa", status: "garantia", sender_id: "me", traveler_id: "x" },
    ] });
    expect(a.map((x) => [x.ref, x.tone, x.title])).toEqual([["KT-B", "now", "Gera o código de entrega"], ["KT-A", "wait", "Em viagem"]]);
  });
  it("entregas concluídas, canceladas ou de outras pessoas não aparecem", () => {
    const a = buildAgenda({ ...base, deals: [
      { id: "a", label: "x", status: "liberado", sender_id: "me" },
      { id: "b", label: "x", status: "cancelado", traveler_id: "me" },
      { id: "c", label: "x", status: "garantia", sender_id: "outro", traveler_id: "outro2" },
    ] });
    expect(a).toEqual([]);
  });
  it("propostas, avaliações e verificação, com o que pede ação primeiro", () => {
    const a = buildAgenda({ ...base,
      deals: [{ id: "w", label: "x", status: "negociacao", sender_id: "me" }],
      offersWaiting: 2,
      ratings: [{ deal_id: "r", label: "Livros", counterpart: "Mário" }],
      missingLevel1: [{ key: "selfie", label: "Selfie a segurar o BI", href: "/identificacao/contactos" }],
    });
    expect(a.map((x) => x.key)).toEqual(["verif", "offers", "rate-r", "deal-w"]);
    expect(a[0].href).toBe("/identificacao/contactos");
    expect(a[1].title).toBe("Responde a 2 propostas");
    expect(a[2].title).toBe("Avalia Mário");
  });
});
