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
  "Medicamentos com receita",
  "Brinquedos e artigos de bebé",
  "Outro item legal",
];
export const DEAL_STEPS: [string, string][] = [
  ["negociacao", "Em negociação"],
  ["garantia", "Pago · em garantia"],
  ["transito", "Em trânsito"],
  ["entregue", "Entregue"],
  ["liberado", "Pago ao viajante"],
];
export const TRIP_STATES: [string, string][] = [["aberto", "Aberto"], ["cheia", "Mala cheia"], ["concluida", "Concluída"]];
export const REQ_STATES: [string, string][] = [["aberto", "Aberto"], ["ligado", "Com viajante"], ["entregue", "Entregue"]];
