import type { Metadata } from "next";
import Link from "next/link";
import { DocSection, Important, LegalLayout, type SummaryPoint, type TocItem } from "@/components/LegalLayout";

export const metadata: Metadata = { title: "Termos de uso", description: "As regras entre a Kamba Traz, quem envia e quem viaja, em linguagem simples." };

const TOC: TocItem[] = [
  { id: "o-que-somos", title: "O que é a Kamba Traz" },
  { id: "conta", title: "A tua conta" },
  { id: "proibido", title: "O que não se envia" },
  { id: "alfandega", title: "Alfândega e impostos" },
  { id: "remetente", title: "Se envias" },
  { id: "viajante", title: "Se viajas" },
  { id: "pagamento", title: "Pagamento e carteira" },
  { id: "problemas", title: "Se houver um problema" },
  { id: "responsabilidade", title: "Até onde vai a nossa responsabilidade" },
  { id: "prejuizo", title: "Se causares um prejuízo" },
  { id: "fim", title: "Suspensão e fim da conta" },
  { id: "alteracoes", title: "Alterações e contacto" },
];

const SUMMARY: SummaryPoint[] = [
  { icon: "shield", title: "Somos intermediários.", text: "Ligamos quem envia a quem viaja e verificamos as pessoas. Não transportamos, não declaramos mercadorias na alfândega e não somos um banco." },
  { icon: "idcard", title: "Toda a gente é identificada.", text: "Telefone e BI para todos, e o bilhete de avião para quem viaja." },
  { icon: "box", title: "Cada um responde pelo que declara e pelo que leva.", text: "O remetente pelo conteúdo e pelo valor. O viajante por conferir, declarar e transportar." },
  { icon: "wallet", title: "O dinheiro fica retido até à entrega.", text: "Só é pago ao viajante quando o destinatário dá o código de 6 dígitos." },
  { icon: "lock", title: "Há coisas que nunca se enviam.", text: "Medicamentos, drogas, armas, dinheiro, bebidas, tabaco e outras. A lista completa está abaixo." },
];

/** Termos de uso. Rascunho preparado para revisão por advogado antes de ser dado como definitivo. */
export default function TermosPage() {
  return (
    <LegalLayout
      title="Termos de uso"
      version="14 de novembro de 2026"
      readMin={5}
      intro="Ao criar conta, fazer um pedido ou publicar uma viagem, aceitas estas regras. Escrevemo-las para se perceberem: dizem quem faz o quê e quem responde por quê."
      summary={SUMMARY}
      toc={TOC}
      related={[{ href: "/privacidade", label: "Política de privacidade" }, { href: "/regras", label: "Regras de segurança" }, { href: "/declaracao", label: "Declaração de conteúdo" }]}
    >
      <DocSection id="o-que-somos" n={1} title="O que é a Kamba Traz">
        <p>A Kamba Traz liga pessoas que querem enviar encomendas de Portugal para Angola (os <b>remetentes</b>) a pessoas que viajam e têm espaço livre na mala (os <b>viajantes</b>).</p>
        <p><b>O que fazemos:</b> verificamos as pessoas, juntamos pedidos e viagens, acompanhamos a entrega e confirmamos o pagamento.</p>
        <p><b>O que não fazemos:</b> não somos transportadores, empresa de courier, despachante aduaneiro, banco nem instituição de pagamento. O transporte é um acordo entre o remetente e o viajante.</p>
      </DocSection>

      <DocSection id="conta" n={2} title="A tua conta">
        <ul>
          <li><b>Idade.</b> Tens de ter 18 anos ou mais.</li>
          <li><b>Dados verdadeiros.</b> Pedimos telefone e BI (número, validade e fotos). O passaporte é opcional. Quem viaja junta ainda a foto do bilhete. A equipa confirma tudo antes de publicar.</li>
          <li><b>Uma conta por pessoa.</b></li>
          <li><b>Recusa.</b> Podemos recusar ou remover contas com dados falsos ou que quebrem estas regras.</li>
        </ul>
      </DocSection>

      <DocSection id="proibido" n={3} title="O que não se envia">
        <p><b>Nunca se transportam:</b> drogas e substâncias controladas, <b>medicamentos</b>, armas, munições e réplicas, dinheiro em numerário e documentos de valor, baterias soltas, gás e líquidos inflamáveis, produtos falsificados, animais, plantas e alimentos perecíveis, bebidas alcoólicas e tabaco, e qualquer volume que o viajante não possa abrir.</p>
        <p>Perfumes levam-se, declarados e com fatura. A lista completa e atualizada está nas <Link href="/regras">regras de segurança</Link>. Podemos recusar qualquer pedido.</p>
      </DocSection>

      <DocSection id="alfandega" n={4} title="Alfândega e impostos">
        <Important title="Quem passa na alfândega é o viajante">
          <p>Ao chegar a Angola, o viajante declara as encomendas de outras pessoas no <b>canal vermelho</b> e cumpre as regras da AGT. A Kamba Traz não declara mercadorias nem garante isenções.</p>
        </Important>
        <ul>
          <li><b>Quem paga as taxas.</b> As taxas e impostos que a alfândega cobrar sobre a encomenda são do <b>remetente</b>, que as reembolsa ao viajante, salvo acordo escrito diferente. A estimativa que a app mostra é só uma indicação.</li>
          <li><b>Teto por viagem.</b> Cada viagem leva no máximo Kz 1 500 000 em mercadoria, somando todos os pedidos. Acima disso a alfândega aplica o regime geral e não aceitamos.</li>
          <li><b>Fatura.</b> Eletrónicos, cosméticos e perfumes, peças e qualquer item acima de 300 € exigem a fatura da compra.</li>
        </ul>
      </DocSection>

      <DocSection id="remetente" n={5} title="Se envias">
        <p>Quem envia promete que:</p>
        <ul>
          <li>o conteúdo e o valor declarados são <b>verdadeiros e completos</b>, e que o item é legal e seu;</li>
          <li>não esconde nada no volume e deixa o viajante abri-lo, fotografá-lo e selá-lo à sua frente;</li>
          <li>entrega a fatura dos bens que a exigem e preenche a <Link href="/declaracao">declaração de conteúdo</Link>;</li>
          <li>paga as taxas aduaneiras e responde pelo que declarou.</li>
        </ul>
      </DocSection>

      <DocSection id="viajante" n={6} title="Se viajas">
        <p>Quem viaja promete que:</p>
        <ul>
          <li><b>confere</b> o conteúdo com o remetente, abre o volume, fotografa e sela, e <b>recusa o que for suspeito</b> ou não estiver na lista;</li>
          <li><b>declara</b> a mercadoria na alfândega e cumpre a lei e as condições da companhia aérea. O viajante assume o risco do que decide levar;</li>
          <li>guarda o volume em segurança, não o abre depois de selado e só o entrega a quem der o código;</li>
          <li>aceita partilhar a localização enquanto leva a encomenda.</li>
        </ul>
      </DocSection>

      <DocSection id="pagamento" n={7} title="Pagamento e carteira">
        <ol>
          <li>O valor da entrega é combinado entre as partes.</li>
          <li>O remetente paga à equipa por transferência ou Multicaixa, e a equipa confirma.</li>
          <li>O valor fica <b>registado como retido</b> até a entrega ser confirmada com o código de 6 dígitos que o remetente dá a quem recebe.</li>
          <li>Só então a equipa paga ao viajante, descontada a comissão da Kamba Traz.</li>
        </ol>
        <Important title="O que a carteira é">
          <p>A carteira é um <b>registo interno</b> dos valores combinados. Não é uma conta bancária, não rende juros e a Kamba Traz não presta serviços bancários nem de instituição de pagamento.</p>
        </Important>
        <p><b>Cancelamento.</b> Se a entrega for cancelada antes de o viajante pegar na encomenda, o valor é devolvido ao remetente.</p>
        <p><b>Prémio do mês.</b> O melhor entregador e o melhor remetente de cada mês ficam o mês seguinte sem comissão, como explicado na página inicial. Podemos alterar ou terminar o prémio.</p>
      </DocSection>

      <DocSection id="problemas" n={8} title="Se houver um problema">
        <p>Perda, dano, atraso, apreensão ou desacordo: <b>avisa a equipa em 7 dias</b> depois da data prevista de entrega. Analisamos as fotos, a lista de conteúdo, a localização e o histórico, e propomos uma solução de boa-fé. As partes tentam resolver primeiro com a equipa.</p>
      </DocSection>

      <DocSection id="responsabilidade" n={9} title="Até onde vai a nossa responsabilidade">
        <Important title="O que a Kamba Traz não garante">
          <p>Somos intermediários, por isso <b>não respondemos</b> pelo transporte, pela perda, dano ou atraso da encomenda, por apreensões, multas ou taxas da alfândega, pelas condições da companhia aérea, nem por atos ou omissões de remetentes e viajantes. Também <b>não oferecemos seguro</b>, salvo se uma oferta concreta o disser.</p>
        </Important>
        <p>Quando a lei nos tornar responsáveis, a responsabilidade limita-se, na medida em que a lei o permitir, à comissão que recebemos na entrega em causa. Nada aqui exclui responsabilidade que a lei não deixe excluir.</p>
        <p>Verificamos pessoas e documentos com cuidado, mas não podemos garantir que ninguém falhe ou minta.</p>
      </DocSection>

      <DocSection id="prejuizo" n={10} title="Se causares um prejuízo">
        <p>Quem der dados falsos, enviar ou levar o que é proibido, ou quebrar estas regras, compensa a Kamba Traz e as outras pessoas pelos prejuízos e custos que causar, incluindo multas, taxas e custos legais.</p>
      </DocSection>

      <DocSection id="fim" n={11} title="Suspensão e fim da conta">
        <p>Podes apagar a tua conta quando quiseres, desde que não tenhas entregas em curso. Podemos suspender ou remover contas que quebrem estas regras ou ponham pessoas em risco.</p>
        <p><b>Avaliações.</b> Depois de cada entrega as duas partes podem avaliar-se, com verdade e respeito. Podemos remover avaliações abusivas.</p>
      </DocSection>

      <DocSection id="alteracoes" n={12} title="Alterações e contacto">
        <p>Podemos atualizar estes termos. A versão em vigor é a desta página, com a data no topo. O que mudou fica registado em baixo.</p>
        <p>Em caso de litígio, procura-se primeiro resolver com a equipa. O que não se resolver fica sujeito à lei e aos tribunais competentes.</p>
        <p>Dados pessoais: ver a <Link href="/privacidade">política de privacidade</Link>. Para falar connosco, usa o formulário de <Link href="/feedback">feedback</Link> ou o WhatsApp da equipa.</p>
        <div className="docversions">
          <p className="itl">O que mudou</p>
          <p><b>14 de novembro de 2026.</b> Primeira versão.</p>
        </div>
      </DocSection>
    </LegalLayout>
  );
}
