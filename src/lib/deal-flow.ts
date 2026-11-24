/**
 * O caminho de uma entrega, guardado na base de dados (deals.status) e no histórico (deal_history):
 *   acordo (negociacao) → pagamento retido (garantia, marcado pela equipa) → recolhido (com fotos)
 *   → em viagem (transito) → entregue (com o código de quem recebe) → libertado (liberado, pago ao viajante).
 * Os nomes guardados mantêm-se (compatibilidade); os nomes à direita são os que se mostram.
 * Cancelar é possível até à entrega. As mesmas regras estão no gatilho deals_transition_guard (estados-entrega.sql).
 */
export const DEAL_FLOW = ["negociacao", "garantia", "recolhido", "transito", "entregue", "liberado"] as const;
export type DealStatus = (typeof DEAL_FLOW)[number] | "cancelado";

export const DEAL_LABEL: Record<DealStatus, string> = {
  negociacao: "Acordo",
  garantia: "Pagamento retido",
  recolhido: "Recolhido",
  transito: "Em viagem",
  entregue: "Entregue",
  liberado: "Libertado",
  cancelado: "Cancelado",
};

/** Quem faz cada passo. */
export type Actor = "equipa" | "viajante";
const STEP_BY: Record<string, Actor> = {
  "negociacao>garantia": "equipa",
  "garantia>recolhido": "viajante",
  "recolhido>transito": "viajante",
  "transito>entregue": "viajante",
  "entregue>liberado": "equipa",
};

const isStatus = (s: string): s is DealStatus => s === "cancelado" || (DEAL_FLOW as readonly string[]).includes(s);

/** A mudança é permitida? Só o passo seguinte, ou cancelar antes da entrega (só a equipa). */
export function canTransition(from: string, to: string, actor: Actor): boolean {
  if (!isStatus(from) || !isStatus(to) || from === to) return false;
  if (to === "cancelado") return actor === "equipa" && !["entregue", "liberado", "cancelado"].includes(from);
  return STEP_BY[`${from}>${to}`] === actor;
}

/** O passo seguinte no caminho (ou null no fim / se cancelada). */
export function nextStatus(from: string): DealStatus | null {
  const i = (DEAL_FLOW as readonly string[]).indexOf(from);
  return i >= 0 && i < DEAL_FLOW.length - 1 ? DEAL_FLOW[i + 1] : null;
}

/** O código de entrega pode ser (re)gerado por quem envia enquanto a encomenda não foi entregue. */
export const codeAllowed = (status: string) => status === "garantia" || status === "recolhido" || status === "transito";

export const CODE_TTL_DAYS = 30;
export const CODE_MAX_ATTEMPTS = 5;

/** Texto do email enviado às duas partes em cada mudança. Sem contactos nem moradas: só o estado e a ligação. */
export function statusEmail(status: DealStatus, label: string, ref: string, url: string): { subject: string; text: string } {
  const what: Record<DealStatus, string> = {
    negociacao: "O acordo foi registado. A equipa vai combinar o pagamento.",
    garantia: "O pagamento foi confirmado e está retido pela Kamba Traz até à entrega. Quem envia já pode gerar o código de entrega na app.",
    recolhido: "O entregador recolheu a encomenda e tirou fotos do volume.",
    transito: "A encomenda está em viagem.",
    entregue: "A entrega foi confirmada com o código de quem recebeu.",
    liberado: "O valor foi libertado ao viajante. Entrega concluída.",
    cancelado: "A entrega foi cancelada. Se o pagamento já estava retido, é devolvido.",
  };
  return {
    subject: `Kamba Traz ${ref}: ${DEAL_LABEL[status]}`,
    text: `${label}\n\n${what[status]}\n\nVê os detalhes e o histórico em ${url}\n\nKamba Traz`,
  };
}
