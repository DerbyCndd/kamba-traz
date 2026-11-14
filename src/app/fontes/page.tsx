import type { Metadata } from "next";
import Link from "next/link";
import { SOURCES, type SourceKey } from "@/lib/sources";

export const metadata: Metadata = { title: "Fontes", description: "De onde vêm as regras da alfândega e da proteção de dados que citamos." };

const ORDER: SourceKey[] = ["guia", "dlp", "circ12", "lei2211", "apd"];

/** Lista de fontes: só o que lemos no texto original. Mostra também o que é leitura nossa e não da lei. */
export default function FontesPage() {
  return (
    <section className="doc">
      <h2>Fontes</h2>
      <p className="muted">Quando dizemos o que a AGT, a alfândega ou a lei exigem, ligamos ao documento original. Só citamos o que lemos e confirmámos. Consultadas em 14 de novembro de 2026.</p>

      <h3>Documentos que usamos</h3>
      <ul className="srclist">
        {ORDER.map((k) => {
          const s = SOURCES[k];
          return (
            <li key={k}>
              <p className="srctitle"><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></p>
              <p className="small">{s.publisher} · consultada em {s.checked}</p>
              <ul>{s.uses.map((u) => <li key={u}>{u}</li>)}</ul>
            </li>
          );
        })}
      </ul>

      <h3>O que é leitura nossa, e não da lei</h3>
      <p>Há regras da Kamba Traz que partem destas fontes mas não estão escritas nelas:</p>
      <ul>
        <li><b>Encomendas de outras pessoas.</b> A lei isenta os bens «destinados ao consumo pessoal» do viajante e não diz nada sobre bens trazidos para terceiros. Nós tratamos essas encomendas como <b>não isentas</b>, por prudência.</li>
        <li><b>Imposto estimado.</b> Mostramos sempre a estimativa de 16%, o cenário prudente, e não a isenção.</li>
        <li><b>Teto de Kz 1 500 000 por viagem.</b> É uma regra nossa, escolhida para ficar sempre abaixo do regime geral.</li>
        <li><b>Câmbio de referência.</b> Convertemos euros em kwanzas a 1 100 Kz por euro. É uma referência nossa, arredondada para cima, e não a taxa do dia.</li>
      </ul>

      <h3>As regras mudam</h3>
      <p>Pautas, circulares e leis mudam. Antes de viajar, confirma no <a href="https://agt.minfin.gov.ao" target="_blank" rel="noopener noreferrer">portal da AGT</a> ou com um despachante oficial. Se encontrares um erro numa citação, diz-nos pelo formulário de <Link href="/feedback">feedback</Link>.</p>
    </section>
  );
}
