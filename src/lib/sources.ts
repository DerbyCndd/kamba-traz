/**
 * Fontes das afirmações da Kamba Traz sobre outras entidades (AGT, alfândega, APD...).
 * Regra da casa: só entra aqui o que lemos no texto original e confirmámos. O que for leitura nossa fica dito como leitura nossa.
 * Consultadas em 14 de novembro de 2026.
 */
export type SourceKey = "guia" | "dlp" | "circ12" | "lei2211" | "apd";
export type SourceRef = [key: SourceKey, ref?: string];

export type Source = {
  short: string;
  title: string;
  publisher: string;
  url: string;
  checked: string;
  uses: string[];
};

const CHECKED = "14 de novembro de 2026";

export const SOURCES: Record<SourceKey, Source> = {
  guia: {
    short: "Guia da AGT",
    title: "Guia do Contribuinte sobre a entrada e saída de pessoas, mercadorias e bens",
    publisher: "AGT (Administração Geral Tributária)",
    url: "https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw40/nzk2/~edisp/minfin4796409.pdf",
    checked: CHECKED,
    uses: ["Canal verde e canal vermelho (ponto 2.1.1)", "Bens isentos e requisitos (2.2)", "Taxa de 16% e regime geral (2.3)", "Limites de bebidas, tabaco e perfumes (2.3)", "Papel dos despachantes (2.7)"],
  },
  dlp: {
    short: "Decreto 1/24",
    title: "Decreto Legislativo Presidencial n.º 1/24, de 3 de janeiro: Pauta Aduaneira, Instruções Preliminares",
    publisher: "Presidente da República de Angola",
    url: "https://angolex.com/paginas/decreto-legislativo-presidencial/instrucoes-preliminares-da-pauta-aduaneira-dos-direitos-de-importacao-e-exportacao.html",
    checked: CHECKED,
    uses: ["Definição de bagagem: «destinados ao consumo pessoal» (art. 1.º, k)", "Isenção até Kz 1 000 000 por viajante (art. 12.º, n.º 1)", "Taxa fixa de 16% (art. 12.º, n.º 2)", "Regime geral acima de Kz 1 500 000 e para pessoas coletivas (art. 12.º, n.os 6 e 7)", "Mercadorias de importação restrita, incluindo medicamentos (Quadro II, art. 60.º)"],
  },
  circ12: {
    short: "Circular 12/2024",
    title: "Circular n.º 12/2024: cobrança de encargos aduaneiros sobre mercadorias importadas por correio e carga expresso",
    publisher: "AGT (Administração Geral Tributária)",
    url: "https://www.angolex.com/paginas/circular/cobranca-encargos-aduaneiros-mercadorias-importadas-correio-expresso-agt-12a-2024a.html",
    checked: CHECKED,
    uses: ["Taxa de 16% sobre a fatura de encomendas por courier, até Kz 1 500 000"],
  },
  lei2211: {
    short: "Lei 22/11",
    title: "Lei n.º 22/11, de 17 de junho: Lei da Protecção de Dados Pessoais",
    publisher: "Assembleia Nacional de Angola",
    url: "https://lex.ao/docs/assembleia-nacional/2011/lei-n-o-22-11-de-17-de-junho/",
    checked: CHECKED,
    uses: ["Direito de informação (art. 25.º)", "Direito de acesso (art. 26.º)", "Direito de oposição (art. 27.º)", "Retificação, atualização e eliminação, em 60 dias úteis", "Decisões individuais automatizadas (art. 29.º)"],
  },
  apd: {
    short: "APD",
    title: "Direitos do cidadão",
    publisher: "APD (Agência de Protecção de Dados)",
    url: "https://apd.ao/ao/direitos-do-cidadao/",
    checked: CHECKED,
    uses: ["Lista dos direitos do titular dos dados", "Reclamações através do Balcão Online da APD"],
  },
};
