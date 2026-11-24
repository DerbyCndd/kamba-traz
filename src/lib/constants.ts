import { DEAL_FLOW, DEAL_LABEL } from "./deal-flow";
export const CITY: Record<string, string> = {
  LIS: "Lisboa", OPO: "Porto", FAO: "Faro", GRU: "São Paulo", DXB: "Dubai", JNB: "Joanesburgo", CDG: "Paris", LHR: "Londres",
  LAD: "Luanda", BUG: "Benguela", SDD: "Lubango", NOV: "Huambo", CAB: "Cabinda", OTH: "Outra cidade",
};
export const FROM = ["LIS", "OPO", "FAO", "GRU", "DXB", "JNB", "CDG", "LHR", "OTH"];
export const TO = ["LAD", "BUG", "SDD", "NOV", "CAB", "OTH"];
export const CATS = [
  "Roupa e calçado",
  "Electrónicos (telemóvel, portátil, acessórios)",
  "Cosméticos e higiene",
  "Peças e ferramentas",
  "Documentos e papelada",
  "Brinquedos e artigos de bebé",
  "Outro item legal",
];
/** Acordo → pagamento retido → recolhido → em viagem → entregue → libertado (ver src/lib/deal-flow.ts). */
export const DEAL_STEPS: [string, string][] = DEAL_FLOW.map((s) => [s, DEAL_LABEL[s]]);
export const TRIP_STATES: [string, string][] = [["aberto", "Aberto"], ["cheia", "Mala cheia"], ["concluida", "Concluída"]];
export const REQ_STATES: [string, string][] = [["aberto", "Aberto"], ["ligado", "Com viajante"], ["entregue", "Entregue"]];

/** Versão dos termos e da privacidade em vigor (a data da última entrada em «O que mudou»). Guarda-se ao criar conta. */
export const LEGAL_VERSION = "2026-11-17";
