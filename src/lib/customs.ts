/**
 * Regras da alfândega angolana (AGT) que a Kamba Traz usa. Fonte: guia da AGT sobre entrada de pessoas e bens
 * e Decreto Legislativo Presidencial n.º 1/24. Confirmar valores sempre que a pauta mudar.
 *  - Até 1 000 000 Kz: isento só se for uso pessoal, sem carácter comercial e em quantidades reduzidas.
 *  - De 1 000 001 a 1 500 000 Kz: taxa forfetária de 16% sobre o valor FOB.
 *  - Acima de 1 500 000 Kz: regime geral (despachante). A Kamba não aceita.
 * Uma encomenda para outra pessoa não é "uso pessoal": por prudência estimamos sempre os 16%.
 */
export const CUSTOMS = {
  personalKz: 1_000_000,
  flatMaxKz: 1_500_000,
  flatPct: 16,
  /** Câmbio de referência €→Kz, arredondado para cima de propósito (o teto fica prudente). Atualizar quando o câmbio mudar muito. */
  eurKz: 1100,
} as const;

export type CustomsEstimate =
  | { kind: "forfetario"; valueKz: number; taxKz: number }
  | { kind: "geral"; valueKz: number; taxKz: null };

export function customsEstimate(valueEur: number): CustomsEstimate {
  const valueKz = Math.round(Math.max(0, valueEur) * CUSTOMS.eurKz);
  if (valueKz > CUSTOMS.flatMaxKz) return { kind: "geral", valueKz, taxKz: null };
  return { kind: "forfetario", valueKz, taxKz: Math.round((valueKz * CUSTOMS.flatPct) / 100) };
}

import { CATS } from "./constants";

/** Bens de risco: exigem a fatura da compra. Eletrónicos, cosméticos (perfumes) e peças, ou qualquer item de valor elevado. */
export const RISK_CATS: string[] = [CATS[1], CATS[2], CATS[3]];
export const INVOICE_MIN_EUR = 300;
export const needsInvoice = (category: string, valueEur: number) => RISK_CATS.includes(category) || valueEur >= INVOICE_MIN_EUR;

/** Valor máximo aceite por viagem, em euros (arredondado para baixo). */
export const MAX_TRIP_EUR = Math.floor(CUSTOMS.flatMaxKz / CUSTOMS.eurKz);
