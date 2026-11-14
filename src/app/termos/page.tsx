import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Termos de uso", description: "As regras entre a Kamba Traz, quem envia e quem viaja." };

/** Termos de uso. Rascunho preparado para revisão por advogado antes de ser dado como definitivo. */
export default function TermosPage() {
  return (
    <section className="doc">
      <h2>Termos de uso</h2>
      <p className="muted">Versão de 14 de novembro de 2026. Ao criar conta, fazer um pedido ou publicar uma viagem aceitas estes termos. Lê-os com atenção: dizem quem responde por quê.</p>

      <h3>1. O que é a Kamba Traz</h3>
      <p>A Kamba Traz é uma plataforma que liga pessoas que querem enviar encomendas de Portugal para Angola («remetentes») a pessoas que viajam e têm espaço livre na mala («viajantes»). <b>Não somos transportadores, empresa de courier, despachante aduaneiro, banco nem instituição de pagamento.</b> O transporte é um acordo entre o remetente e o viajante. A nossa equipa verifica as pessoas, junta as partes, acompanha a entrega e confirma o pagamento.</p>

      <h3>2. Conta e identificação</h3>
      <ul>
        <li>Tens de ter 18 anos ou mais e dar dados verdadeiros e atuais.</li>
        <li>Pedimos telefone, BI (número, validade e fotos) e, se quiseres, passaporte. Quem viaja junta ainda a foto do bilhete de avião. A equipa confirma tudo antes de publicar.</li>
        <li>Cada pessoa tem uma só conta. Podemos recusar, suspender ou remover contas com dados falsos ou que quebrem estes termos.</li>
      </ul>

      <h3>3. O que não se envia</h3>
      <p>Nunca se transportam: drogas e substâncias controladas, medicamentos, armas, munições e réplicas, dinheiro em numerário e documentos de valor, baterias soltas, gás e líquidos inflamáveis, produtos falsificados, animais, plantas e alimentos perecíveis, bebidas alcoólicas e tabaco, e qualquer volume que o viajante não possa abrir. A lista completa está nas <Link href="/regras">regras</Link>. Podemos recusar qualquer pedido, sem ter de justificar.</p>

      <h3>4. Alfândega e impostos</h3>
      <ul>
        <li>Quem passa na alfândega é o <b>viajante</b>. Deve declarar as encomendas de outras pessoas, no canal vermelho, e cumprir as regras da AGT.</li>
        <li>As taxas e impostos que a alfândega cobrar sobre a encomenda são <b>suportados pelo remetente</b>, que os reembolsa ao viajante, salvo acordo diferente escrito entre as partes. A estimativa que a app mostra é só uma indicação.</li>
        <li>Cada viagem leva, no máximo, mercadoria no valor de Kz 1 500 000 (soma de todos os pedidos). Acima disso, a alfândega aplica o regime geral e a Kamba Traz não aceita.</li>
        <li>Bens de risco (eletrónicos, cosméticos e perfumes, peças, e itens de valor elevado) exigem a <b>fatura da compra</b>.</li>
        <li>A Kamba Traz não declara mercadorias à alfândega, não paga taxas em nome de ninguém e não garante isenções.</li>
      </ul>

      <h3>5. O que o remetente promete</h3>
      <ul>
        <li>Que o conteúdo e o valor declarados são verdadeiros e completos, e que o item é legal e é seu.</li>
        <li>Que não esconde nada no volume e aceita que o viajante o abra, fotografe e sele na sua presença.</li>
        <li>Que entrega a fatura dos bens de risco e a lista do conteúdo (<Link href="/declaracao">declaração de conteúdo</Link>).</li>
        <li>Que paga as taxas aduaneiras e responde pelo que declarou.</li>
      </ul>

      <h3>6. O que o viajante promete</h3>
      <ul>
        <li>Que confere o conteúdo com o remetente, abre o volume, fotografa e sela, e <b>recusa qualquer coisa suspeita ou fora da lista</b>.</li>
        <li>Que declara a mercadoria na alfândega e cumpre as leis dos países por onde passa e as condições da companhia aérea. <b>O viajante assume o risco do que decide levar.</b></li>
        <li>Que guarda o volume em segurança, não o abre depois de selado e o entrega só a quem tem o código.</li>
        <li>Que aceita partilhar a localização enquanto leva a encomenda.</li>
      </ul>

      <h3>7. Pagamento e carteira</h3>
      <ul>
        <li>O valor da entrega é combinado entre as partes. O remetente paga à equipa por transferência ou Multicaixa, e a equipa confirma o pagamento.</li>
        <li>Depois de confirmado, o valor fica <b>registado como retido</b> até a entrega ser confirmada com o código de 6 dígitos que o remetente dá a quem recebe. Só então a equipa paga ao viajante, descontada a comissão da Kamba Traz.</li>
        <li>A carteira é um registo interno dos valores combinados. Não é uma conta bancária, não rende juros e a Kamba Traz não presta serviços bancários nem de instituição de pagamento.</li>
        <li>Se a entrega for cancelada antes de o viajante pegar na encomenda, o valor é devolvido ao remetente.</li>
        <li>O melhor entregador e o melhor remetente de cada mês ficam o mês seguinte sem comissão, nos termos descritos na página inicial. Podemos mudar ou terminar este prémio.</li>
      </ul>

      <h3>8. Se houver um problema</h3>
      <p>Em caso de perda, dano, atraso, apreensão ou desacordo, a equipa analisa as fotos, a lista de conteúdo, a localização e o histórico, e propõe uma solução de boa-fé. Tem de ser avisada no prazo de 7 dias após a data prevista de entrega. As partes devem tentar resolver primeiro com a equipa.</p>

      <h3>9. Responsabilidade da Kamba Traz</h3>
      <ul>
        <li>Somos intermediários. <b>Não respondemos</b> pelo transporte, pela perda, dano ou atraso da encomenda, por apreensões, multas ou taxas da alfândega, pelas condições da companhia aérea, nem por atos ou omissões de remetentes e viajantes.</li>
        <li>Não oferecemos seguro, salvo se for dito expressamente numa oferta concreta.</li>
        <li>Quando a lei nos tornar responsáveis, a nossa responsabilidade limita-se, na medida permitida por lei, à comissão que a Kamba Traz recebeu na entrega em causa. Nada nestes termos exclui responsabilidade que a lei não permita excluir.</li>
        <li>Verificamos pessoas e documentos com cuidado, mas não garantimos que ninguém falhe ou minta.</li>
      </ul>

      <h3>10. Compensação</h3>
      <p>Quem declarar dados falsos, enviar ou levar o que é proibido, ou quebrar estes termos, compensa a Kamba Traz e as outras pessoas pelos prejuízos e custos que causar (incluindo multas, taxas e custos legais).</p>

      <h3>11. Localização e dados</h3>
      <p>A localização do viajante só é recolhida enquanto leva a encomenda, é vista por quem enviou e pela equipa, e é apagada quando a entrega termina. Os restantes dados são tratados como explica a <Link href="/privacidade">Política de Privacidade</Link>.</p>

      <h3>12. Avaliações</h3>
      <p>Depois de cada entrega, as duas partes podem avaliar-se. As avaliações têm de ser verdadeiras e respeitosas. Podemos remover avaliações abusivas.</p>

      <h3>13. Suspensão e fim</h3>
      <p>Podes apagar a tua conta quando quiseres, desde que não tenhas entregas em curso. Podemos suspender ou remover contas que quebrem estes termos ou ponham pessoas em risco.</p>

      <h3>14. Alterações e litígios</h3>
      <p>Podemos atualizar estes termos. A versão em vigor é a publicada nesta página, com a data no topo. Em caso de litígio, as partes procuram primeiro resolvê-lo com a equipa; o que não se resolver fica sujeito à lei e aos tribunais competentes.</p>

      <h3>15. Contacto</h3>
      <p>Fala connosco pelo formulário de <Link href="/feedback">feedback</Link> ou pelo WhatsApp da equipa.</p>
    </section>
  );
}
