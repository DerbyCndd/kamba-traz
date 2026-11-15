/**
 * Moedas dos países de onde sai a encomenda. A Kamba Traz trabalha em euros por dentro (fatura a partir de 300 €,
 * teto por viagem, estimativa da alfândega, limite das contas novas), por isso o valor escrito na moeda local é convertido.
 *
 * As taxas são de REFERÊNCIA, não ao vivo: unidades da moeda por 1 €, arredondadas de propósito para valores um pouco
 * abaixo dos de mercado, para o valor em euros nunca ficar abaixo do real (fonte: exchangerate-api.com, 15 nov 2026,
 * quando 1 € valia 0,835 GBP, 6,238 BRL, 4,054 AED e 18,676 ZAR). Rever de tempos a tempos, como o câmbio €→Kz em customs.ts.
 */
export const RATES_DATE = "15 de novembro de 2026";

export const CURRENCIES = {
  EUR: { symbol: "€", name: "euros", perEur: 1 },
  GBP: { symbol: "£", name: "libras", perEur: 0.83 },
  BRL: { symbol: "R$", name: "reais", perEur: 6.2 },
  AED: { symbol: "AED", name: "dirhams", perEur: 4 },
  ZAR: { symbol: "R", name: "rands", perEur: 18.5 },
} as const;

export type Cur = keyof typeof CURRENCIES;
export const isCur = (c: unknown): c is Cur => typeof c === "string" && Object.prototype.hasOwnProperty.call(CURRENCIES, c);

/** A moeda do país de cada cidade de origem. «Outra cidade» começa em euros e a pessoa pode mudar. */
export const ORIGIN_CURRENCY: Record<string, Cur> = { LIS: "EUR", OPO: "EUR", FAO: "EUR", CDG: "EUR", LHR: "GBP", GRU: "BRL", DXB: "AED", JNB: "ZAR", OTH: "EUR" };

/** Converte para euros, arredondando para cima ao euro (prudente para a alfândega e para os limites). */
export const toEur = (amount: number, cur: Cur): number => {
  if (!(amount > 0)) return 0;
  return cur === "EUR" ? Math.ceil(amount) : Math.ceil(amount / CURRENCIES[cur].perEur);
};
