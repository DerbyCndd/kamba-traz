import type { Metadata } from "next";
import Link from "next/link";
import { Src } from "@/components/Src";
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

      <div className="noprint">
        <h3>Como usar esta folha</h3>
        <p><b>Quando usar:</b> no momento em que o remetente entrega o volume ao viajante, com os dois presentes. É uma folha por volume: se o viajante leva dois volumes do mesmo remetente, são duas folhas.</p>

        <p><b>Papel ou digital: as duas formas servem:</b></p>
        <ul>
          <li><b>Em papel (recomendado):</b> carregue em «Imprimir ou guardar em PDF», imprima e preencha à caneta, com letra legível. O viajante deve levar a folha impressa na mala, junto à fatura, para a mostrar se for pedida num controlo.</li>
          <li><b>Em formato digital:</b> carregue no mesmo botão e escolha «Guardar como PDF». Fica um PDF em branco, que se preenche e assina num telemóvel ou computador com uma aplicação que permita escrever sobre PDF ou fotografias, ou então preenche-se uma folha impressa e fotografa-se. Quem preencher em formato digital deve enviar o PDF aos outros dois e guardar uma cópia.</li>
          <li><b>Nos dois casos,</b> todos ficam com uma cópia: o remetente, o viajante e, se possível, o destinatário.</li>
        </ul>

        <p><b>Passo a passo:</b></p>
        <ol>
          <li><b>Cabeçalho:</b> escreva a referência do pedido (começa por KT-, aparece na app), a data, a rota e os nomes e telefones do remetente, do viajante e do destinatário (com a cidade em Angola).</li>
          <li><b>Abra o volume e confira:</b> o remetente abre o volume à frente do viajante. Os dois conferem o que lá está contra a lista. O viajante recusa o que não estiver na lista ou lhe parecer suspeito.</li>
          <li><b>Liste o conteúdo:</b> uma linha por tipo de item: descrição clara (por exemplo, «telemóvel Samsung A15», e não «eletrónicos»), quantidade, valor unitário e total em euros. Some tudo em «Valor total declarado». Se faltarem linhas, use outra folha e indique «folha 1 de 2».</li>
          <li><b>Fatura:</b> marque «sim» nos itens com fatura anexada. Eletrónicos, cosméticos (perfumes), peças e qualquer item acima de 300 € exigem a fatura da compra.</li>
          <li><b>Pese o volume:</b> escreva o peso em quilos. Confirme que o total das mercadorias da viagem não passa de Kz 1 500 000.</li>
          <li><b>Sele e fotografe:</b> feche e sele o volume. Fotografe o volume selado com a folha ao lado, de forma que a referência KT- e o conteúdo se leiam. Envie as fotos pela app, como pede o processo (pelo menos 2).</li>
          <li><b>Assine:</b> remetente e viajante assinam e datam logo ali. Não assine uma folha em branco nem com linhas por preencher.</li>
          <li><b>Na entrega em Angola:</b> o destinatário confere o estado do volume, assina em «Destinatário», escreve a data e o estado, e só então dá o código de entrega ao viajante.</li>
        </ol>

        <p><b>Conselhos:</b></p>
        <ul>
          <li>Declare o valor real. Uma declaração falsa ou incompleta é responsabilidade do remetente.</li>
          <li>Não escreva nada que a lista de proibidos não permita (ver <Link href="/regras">as regras</Link>). Se o remetente não quiser abrir o volume ou mostrar o que leva, o viajante não deve aceitar.</li>
          <li>Se algo mudar depois de assinar (um item sai ou entra), refaça a folha e assine de novo. Não risque a folha assinada.</li>
          <li>Guarde a folha e as fotos até a entrega estar confirmada e o assunto encerrado.</li>
        </ul>

        <p className="hint">A folha é um apoio à confiança entre as partes. A Kamba Traz não guarda este documento nem o valida, e ainda não confirmámos com um advogado o seu valor legal, nem se a alfândega ou a companhia aérea aceitam a versão só digital. Por isso, leve a versão impressa na viagem.</p>
      </div>

      <div className="doctablewrap"><table className="doctable">
        <tbody>
          <tr><th>Referência do pedido (KT-)</th><td>&nbsp;</td><th>Data</th><td>&nbsp;</td></tr>
          <tr><th>Remetente (nome e telefone)</th><td colSpan={3}>&nbsp;</td></tr>
          <tr><th>Viajante (nome e telefone)</th><td colSpan={3}>&nbsp;</td></tr>
          <tr><th>Destinatário em Angola (nome, telefone e cidade)</th><td colSpan={3}>&nbsp;</td></tr>
          <tr><th>Rota</th><td>&nbsp;</td><th>Peso do volume (kg)</th><td>&nbsp;</td></tr>
        </tbody>
      </table></div>

      <h3>Conteúdo do volume</h3>
      <div className="doctablewrap"><table className="doctable">
        <thead><tr><th>Descrição</th><th>Qtd.</th><th>Valor unitário (€)</th><th>Total (€)</th><th>Fatura (sim/não)</th></tr></thead>
        <tbody>
          {ROWS.map((i) => <tr key={i}><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>)}
          <tr><th colSpan={3}>Valor total declarado</th><td>&nbsp;</td><td>&nbsp;</td></tr>
        </tbody>
      </table></div>
      <p className="hint">Cada viagem leva no máximo Kz 1 500 000 em mercadoria. Os eletrónicos, cosméticos (perfumes), peças e itens acima de 300 € levam a fatura da compra, anexada. <Src refs={[["dlp", "art. 12.º, n.º 6"]]} /></p>

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

      <div className="doctablewrap"><table className="doctable sign">
        <thead><tr><th>Remetente</th><th>Viajante</th><th>Destinatário (à entrega)</th></tr></thead>
        <tbody><tr><td>Assinatura:<br /><br /><br />Data:</td><td>Assinatura:<br /><br /><br />Data:</td><td>Assinatura:<br /><br /><br />Data e estado do volume:</td></tr></tbody>
      </table></div>
    </section>
  );
}
