/**
 * «O que precisa de ti agora»: a lista da página inicial, construída a partir das entregas, das propostas,
 * das avaliações em falta e do nível de verificação. Função pura (testada em agenda.test.ts).
 * - now: precisa de uma ação tua.
 * - wait: está a andar; só acompanhas.
 */
import type { Need } from "./verification";

export type AgendaDeal = { id: string; label: string; status: string; sender_id?: string | null; traveler_id?: string | null };
export type AgendaItem = { key: string; ref: string | null; tone: "now" | "wait"; title: string; detail: string; href: string; cta: string };
export type AgendaInput = {
  userId: string;
  deals: AgendaDeal[];
  offersWaiting: number;
  ratings: { deal_id: string; label: string; counterpart: string }[];
  /** O que falta para o nível 1 (sem ele, nada se publica). */
  missingLevel1: Need[];
  refOf: (id: string) => string;
};

export function buildAgenda(i: AgendaInput): AgendaItem[] {
  const out: AgendaItem[] = [];
  if (i.missingLevel1.length) {
    const first = i.missingLevel1[0];
    out.push({ key: "verif", ref: null, tone: "now", title: "Completa a tua verificação",
      detail: `Falta: ${i.missingLevel1.map((n) => n.label.charAt(0).toLowerCase() + n.label.slice(1)).join(", ")}. Sem isto não podes publicar pedidos.`, href: first.href, cta: "Continuar" });
  }
  for (const d of i.deals) {
    const ref = i.refOf(d.id);
    const href = `/entregas/${d.id}`;
    const mineToCarry = d.traveler_id === i.userId;
    const mineToSend = d.sender_id === i.userId;
    if (!mineToCarry && !mineToSend) continue;
    const item = (tone: AgendaItem["tone"], title: string, detail: string, cta = "Ver entrega") =>
      out.push({ key: `deal-${d.id}`, ref, tone, title, detail, href, cta });
    if (mineToCarry) {
      if (d.status === "garantia") item("now", "Recolhe a encomenda", `${d.label}. Tira pelo menos 2 fotos do volume e confirma a recolha.`, "Recolher");
      else if (d.status === "recolhido") item("now", "Confirma que partiste", `${d.label}. Quem envia passa a ver o percurso no mapa.`, "Estou em viagem");
      else if (d.status === "transito") item("now", "Entrega e pede o código", `${d.label}. Quem recebe dá-te o código de 6 dígitos.`, "Confirmar entrega");
      else if (d.status === "negociacao") item("wait", "A equipa está a acertar o pagamento", `${d.label}. Ainda não recolhes a encomenda.`);
      else if (d.status === "entregue") item("wait", "Entregue: falta o pagamento", `${d.label}. A equipa vai libertar o teu valor.`);
    } else {
      if (d.status === "garantia") item("now", "Gera o código de entrega", `${d.label}. Dá-o só a quem recebe, para o entregar no fim.`, "Gerar código");
      else if (d.status === "recolhido") item("wait", "Encomenda recolhida", `${d.label}. O entregador já a tem e tirou fotos.`);
      else if (d.status === "transito") item("wait", "Em viagem", `${d.label}. Acompanha-a no mapa.`, "Ver no mapa");
      else if (d.status === "negociacao") item("wait", "A equipa está a combinar o pagamento contigo", `${d.label}.`);
      else if (d.status === "entregue") item("wait", "Entregue", `${d.label}. Já chegou a quem recebe.`);
    }
  }
  if (i.offersWaiting > 0) {
    out.push({ key: "offers", ref: null, tone: "now", title: i.offersWaiting === 1 ? "Responde a 1 proposta" : `Responde a ${i.offersWaiting} propostas`,
      detail: "Aceita, recusa ou propõe outro valor.", href: "/propostas", cta: "Responder" });
  }
  for (const r of i.ratings) {
    out.push({ key: `rate-${r.deal_id}`, ref: i.refOf(r.deal_id), tone: "now", title: `Avalia ${r.counterpart || "a outra parte"}`,
      detail: `${r.label}. A tua avaliação ajuda os próximos a confiar.`, href: "/meus", cta: "Avaliar" });
  }
  // Primeiro o que precisa de ti; a ordem dentro de cada grupo mantém-se.
  return [...out.filter((x) => x.tone === "now"), ...out.filter((x) => x.tone === "wait")];
}
