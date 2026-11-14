import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Declaração de conteúdo", description: "Folha para listar o conteúdo de cada volume e assinar entre remetente, viajante e destinatário." };

const ROWS = Array.from({ length: 8 }, (_, i) => i);

/** Folha para imprimir ou preencher: lista do conteúdo de cada volume, assinada pelas partes. Rascunho para revisão por advogado. */
export default function DeclaracaoPage() {
  return (
    <section className="doc form">
      <h2>Declaração de conteúdo</h2>
      <p className="muted noprint">Preenche uma por volume, no momento da entrega ao viajante, e tira uma foto dela junto ao volume selado. <Link href="/termos">Termos de uso</Link></p>
      <div className="noprint row"><PrintButton /></div>

      <table className="doctable">
        <tbody>
          <tr><th>Referência do pedido (KT-)</th><td>&nbsp;</td><th>Data</th><td>&nbsp;</td></tr>
          <tr><th>Remetente (nome e telefone)</th><td colSpan={3}>&nbsp;</td></tr>
          <tr><th>Viajante (nome e telefone)</th><td colSpan={3}>&nbsp;</td></tr>
          <tr><th>Destinatário em Angola (nome, telefone e cidade)</th><td colSpan={3}>&nbsp;</td></tr>
          <tr><th>Rota</th><td>&nbsp;</td><th>Peso do volume (kg)</th><td>&nbsp;</td></tr>
        </tbody>
      </table>

      <h3>Conteúdo do volume</h3>
      <table className="doctable">
        <thead><tr><th>Descrição</th><th>Qtd.</th><th>Valor unitário (€)</th><th>Total (€)</th><th>Fatura (sim/não)</th></tr></thead>
        <tbody>
          {ROWS.map((i) => <tr key={i}><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>)}
          <tr><th colSpan={3}>Valor total declarado</th><td>&nbsp;</td><td>&nbsp;</td></tr>
        </tbody>
      </table>
      <p className="hint">Cada viagem leva no máximo Kz 1 500 000 em mercadoria. Os eletrónicos, cosméticos (perfumes), peças e itens acima de 300 € levam a fatura da compra, anexada.</p>

      <h3>Declarações</h3>
      <p><b>O remetente declara que:</b></p>
      <ol>
        <li>o conteúdo e o valor acima são verdadeiros e completos, e os bens são seus e legais;</li>
        <li>não há medicamentos, drogas, armas, dinheiro em numerário, baterias soltas, líquidos inflamáveis, produtos falsificados, animais, plantas, alimentos perecíveis, bebidas alcoólicas nem tabaco;</li>
        <li>o volume foi aberto, conferido e selado na presença do viajante;</li>
        <li>responde pelo que declarou e paga as taxas e impostos que a alfândega cobrar sobre estes bens.</li>
      </ol>
      <p><b>O viajante declara que:</b></p>
      <ol>
        <li>conferiu o conteúdo com o remetente e recusou o que lhe pareceu suspeito;</li>
        <li>vai declarar os bens na alfândega, pelo canal vermelho, e não abrirá o volume selado;</li>
        <li>entrega o volume só a quem tiver o código de entrega;</li>
        <li>assume o risco de levar estes bens e cumprir as condições da companhia aérea e a lei.</li>
      </ol>
      <p><b>O destinatário</b>, ao receber, confirma o estado do volume e dá o código ao viajante.</p>
      <p className="hint">A Kamba Traz é intermediária: não transporta, não declara mercadorias e não responde por perda, dano, atraso ou apreensão (ver os termos de uso).</p>

      <table className="doctable sign">
        <thead><tr><th>Remetente</th><th>Viajante</th><th>Destinatário (à entrega)</th></tr></thead>
        <tbody><tr><td>Assinatura:<br /><br /><br />Data:</td><td>Assinatura:<br /><br /><br />Data:</td><td>Assinatura:<br /><br /><br />Data e estado do volume:</td></tr></tbody>
      </table>
    </section>
  );
}
