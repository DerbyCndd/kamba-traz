import type { Metadata } from "next";
import Link from "next/link";
import { DocSection, Important, LegalLayout, type SummaryPoint, type TocItem } from "@/components/LegalLayout";
import { Src } from "@/components/Src";

export const metadata: Metadata = { title: "Política de privacidade", description: "Que dados guardamos, porquê, quem os vê e como os apagar." };

const TOC: TocItem[] = [
  { id: "quem", title: "Quem trata os teus dados" },
  { id: "dados", title: "O que recolhemos e porquê" },
  { id: "vistos", title: "Quem vê os teus dados" },
  { id: "localizacao", title: "Localização" },
  { id: "protecao", title: "Como os protegemos" },
  { id: "tempo", title: "Quanto tempo guardamos" },
  { id: "direitos", title: "Os teus direitos" },
  { id: "automaticas", title: "Decisões automáticas" },
  { id: "cookies", title: "Cookies" },
  { id: "mudancas", title: "Alterações e contacto" },
];

const SUMMARY: SummaryPoint[] = [
  { icon: "shield", title: "Não vendemos os teus dados.", text: "Não há publicidade nem seguimento." },
  { icon: "lock", title: "Só a equipa vê os teus documentos.", text: "Os números ficam cifrados e as fotos num espaço privado." },
  { icon: "idcard", title: "Pedimos o mínimo.", text: "Telefone, BI, morada e um contacto de familiar são obrigatórios. O passaporte só é obrigatório para quem viaja." },
  { icon: "pin", title: "A localização só existe durante a entrega.", text: "É apagada quando a entrega termina." },
  { icon: "key", title: "Mandas tu.", text: "Podes pedir para ver, corrigir ou apagar os teus dados." },
];

const ROWS: [string, string, string][] = [
  ["Nome, email, palavra-passe", "Obrigatório", "Criar e proteger a tua conta. A palavra-passe é guardada cifrada."],
  ["Telefone", "Obrigatório", "A equipa fala contigo sobre pedidos e entregas."],
  ["Número, validade e fotos do BI", "Obrigatório", "Saber quem envia e quem viaja, e prevenir fraude."],
  ["Selfie a segurar o BI", "Obrigatório", "A equipa compara o teu rosto com o BI, para reduzir documentos emprestados ou roubados. É uma verificação feita por pessoas, não reconhecimento facial automático. A foto fica em espaço privado e só a equipa a vê."],
  ["Morada, estado civil e contactos de familiares (mãe, pai, cônjuge)", "Obrigatório", "Agir depressa em caso de emergência ou de suspeita de fraude, e tornar mais difícil fugir com uma encomenda. Ficam cifrados e só a equipa os vê. Quem os indica garante que tem autorização dessas pessoas."],
  ["Passaporte (número, validade, fotos)", "Obrigatório para quem viaja", "Confirmar quem viaja, com o bilhete. Quem só envia não precisa."],
  ["Foto de perfil", "Opcional", "A equipa reconhece-te melhor."],
  ["Foto do bilhete de avião e datas", "Obrigatório para quem viaja", "Confirmar que a viagem existe."],
  ["Rota, peso, valor e descrição do item; fatura", "Obrigatório para quem envia", "Juntar pedidos a viagens e cumprir a alfândega."],
  ["Local de recolha e dados de quem recebe em Angola (nome, telefone, morada)", "Obrigatório para quem envia (o local de recolha só se quiser que o entregador vá buscar)", "O entregador pegar e entregar a encomenda. Quem envia garante que tem autorização de quem recebe."],
  ["Morada onde o entregador recebe encomendas (opcional)", "Opcional, para quem viaja", "Quem envia levar-lhe a encomenda, se preferir. Só quem envia a vê, com o pagamento retido."],
  ["Localização do telemóvel", "Só quem leva a encomenda, e só em trânsito", "Quem enviou acompanha a entrega no mapa."],
  ["Fotos do estado do volume", "Obrigatório para quem leva a encomenda", "Provar em que estado o volume foi recebido, se houver um problema."],
  ["Propostas de valor entre quem envia e quem viaja", "Obrigatório nas entregas", "Combinar o preço. Não há conversa livre: só valores e estado da proposta."],
  ["Pagamentos e movimentos da carteira", "Obrigatório nas entregas", "Reter e pagar os valores, e guardar o registo."],
  ["Impressão cifrada do IP e do email", "Automático", "Limitar tentativas repetidas de entrada e registo. Não guardamos o IP nem o email em claro para isto."],
  ["Avaliações e feedback", "Opcional", "Melhorar o serviço e dar confiança às duas partes."],
];

/** Política de privacidade. Rascunho preparado para revisão por advogado antes de ser dado como definitivo. */
export default function PrivacidadePage() {
  return (
    <LegalLayout
      title="Política de privacidade"
      readMin={4}
      intro="Explicamos que dados guardamos, para quê, quem os vê e como os podes ver, corrigir ou apagar."
      summary={SUMMARY}
      toc={TOC}
      pdf="/documentos/Politica-de-Privacidade.pdf"
      related={[{ href: "/termos", label: "Termos de uso" }, { href: "/regras", label: "Regras de segurança" }, { href: "/feedback", label: "Pedir ou corrigir dados" }]}
    >
      <DocSection id="quem" n={1} title="Quem trata os teus dados">
        <p>A Kamba Traz é a responsável pelos dados pessoais recolhidos nesta plataforma. Para qualquer pedido sobre os teus dados, usa o formulário de <Link href="/feedback">feedback</Link>.</p>
      </DocSection>

      <DocSection id="dados" n={2} title="O que recolhemos e porquê">
        <p>Só pedimos o que é preciso. Quando um dado é <b>obrigatório</b>, sem ele não conseguimos prestar o serviço.</p>
        <div className="doctablewrap">
          <table className="doctable stack">
            <thead><tr><th>Dado</th><th>É obrigatório?</th><th>Porquê</th></tr></thead>
            <tbody>
              {ROWS.map(([d, o, p]) => <tr key={d}><td data-label="Dado">{d}</td><td data-label="Obrigatório?">{o}</td><td data-label="Porquê">{p}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p><b>Porque podemos tratar estes dados:</b> porque nos forneces os dados para usar o serviço, porque precisamos deles para o prestar e para cumprir a lei, e, quando a lei o exige, com o teu consentimento.</p>
      </DocSection>

      <DocSection id="vistos" n={3} title="Quem vê os teus dados">
        <ul>
          <li><b>O público</b> só vê o primeiro nome, a rota e valores de referência. Nunca contactos nem documentos.</li>
          <li><b>A outra parte da entrega</b> vê só o que é preciso para a entrega acontecer. Antes de o pagamento ficar retido vê só o primeiro nome. Depois, e até a entrega ser confirmada, vê o nome e o telefone de quem está do outro lado; o entregador vê ainda o local de recolha (se for ele a ir buscar) e o nome, o telefone e a morada de quem recebe, e quem envia vê onde o entregador recebe encomendas, se ele o indicou. Quando a entrega termina, deixa de ver tudo isto. Os documentos, a morada de residência e os familiares nunca são partilhados com ela.</li>
          <li><b>A equipa da Kamba</b> vê os documentos, os números e as fotos, para confirmar a identificação. Cada abertura de um documento fica registada.</li>
          <li><b>Serviços que usamos para funcionar:</b> a Supabase (base de dados, autenticação e ficheiros), a Vercel (alojamento do site), o OpenStreetMap (mapas), o Sentry (avisos de erros técnicos: removemos nomes, contactos, documentos e o que escreves antes do envio) e o Resend (email do resumo diário à equipa, que só tem contagens). Podem tratar dados em servidores fora de Angola.</li>
          <li><b>Autoridades,</b> só quando a lei o exigir.</li>
        </ul>
      </DocSection>

      <DocSection id="localizacao" n={4} title="Localização">
        <Important title="Só durante a entrega">
          <p>Se levas uma encomenda, partilhas a localização do teu telemóvel <b>só enquanto ela está em trânsito</b>, com a página aberta. Quem enviou e a equipa veem-na no mapa. Quando a entrega termina, apagamo-la. Podes parar de partilhar quando quiseres.</p>
        </Important>
      </DocSection>

      <DocSection id="protecao" n={5} title="Como os protegemos">
        <ul>
          <li><b>Cifra.</b> Os números do BI e do passaporte são cifrados antes de serem guardados. A chave não está na base de dados.</li>
          <li><b>Documento repetido.</b> Guardamos também uma «impressão» do número do documento, que não permite recuperá-lo, só para a equipa ver se o mesmo número aparece em contas diferentes e travar fraudes. Quem se identifica não é avisado, e a equipa só vê o primeiro nome da outra conta. Isto não bloqueia ninguém sozinho: pode ser engano, e a equipa decide.</li>
          <li><b>Fotos privadas.</b> Documentos, bilhetes e faturas ficam num espaço privado, com ligações temporárias que só a equipa usa.</li>
          <li><b>Acesso limitado.</b> Cada pessoa só vê o que é seu.</li>
          <li><b>Se algo correr mal.</b> Nenhum sistema é perfeito. Se uma falha afetar os teus dados, avisamos-te.</li>
        </ul>
      </DocSection>

      <DocSection id="tempo" n={6} title="Quanto tempo guardamos">
        <ul>
          <li><b>Localização:</b> apagada quando a entrega termina.</li>
          <li><b>Contactos entre as partes e dados de recolha e entrega:</b> só se mostram à outra parte enquanto a entrega está ativa; guardam-se com o pedido. A morada e os familiares guardam-se enquanto a conta existir.</li>
          <li><b>Contagem de tentativas de entrada e registo:</b> apagada ao fim de 1 dia.</li>
          <li><b>Conta, documentos e fotos:</b> enquanto a conta existir (a impressão do número do documento apaga-se com a identificação). Se a apagares, apagamos os teus documentos e as tuas fotos, exceto o que a lei nos obrigue a guardar (por exemplo, registos de pagamentos e de identificação para fins fiscais e de prevenção de fraude).</li>
        </ul>
      </DocSection>

      <DocSection id="direitos" n={7} title="Os teus direitos">
        <p>Nos termos da Lei de Proteção de Dados Pessoais de Angola (Lei 22/11), podes:</p>
        <ul>
          <li><b>Saber</b> que dados temos sobre ti e para quê.</li>
          <li><b>Aceder e receber</b> uma cópia.</li>
          <li><b>Corrigir</b> o que estiver errado e <b>atualizar</b> o que mudou.</li>
          <li><b>Apagar</b> os teus dados.</li>
          <li><b>Opor-te</b> a um tratamento, e retirar o consentimento que deste.</li>
        </ul>
        <p>Corrigimos, atualizamos ou apagamos no prazo que a lei fixa: até 60 dias úteis. <Src refs={[["lei2211", "arts. 25.º a 28.º"], ["apd", "direitos do cidadão"]]} /></p>
        <p><b>Como exercer:</b> pelo formulário de <Link href="/feedback">feedback</Link>. Se achares que não cumprimos a lei, podes queixar-te à Agência de Proteção de Dados (APD), pelo seu <a href="https://apd.ao" target="_blank" rel="noopener noreferrer">Balcão Online</a>.</p>
      </DocSection>

      <DocSection id="automaticas" n={8} title="Decisões automáticas">
        <p>O prémio do mês (um mês sem comissão) é calculado <b>automaticamente</b> a partir das avaliações. Se achares que o resultado está errado, pede à equipa que o reveja. A lei dá-te o direito de não ficares sujeito a uma decisão automatizada que produza efeitos na tua esfera jurídica. <Src refs={[["lei2211", "art. 29.º"]]} /></p>
      </DocSection>

      <DocSection id="cookies" n={9} title="Cookies">
        <p>Um cookie é um pequeno texto que o navegador guarda. Usamos só os necessários: o que mantém a tua conta iniciada e a tua escolha de modo claro ou escuro. Não usamos publicidade nem seguimento. Se os bloqueares, não consegues iniciar sessão.</p>
      </DocSection>

      <DocSection id="mudancas" n={10} title="Alterações e contacto">
        <p>A plataforma é só para maiores de 18 anos. Podemos atualizar esta política: a versão em vigor é a desta página, e o que mudou fica registado em baixo, com a data. Ver também os <Link href="/termos">termos de uso</Link>.</p>
        <div className="docversions">
          <p className="itl">O que mudou</p>
          <p><b>17 de novembro de 2026.</b> Passámos a pedir a morada, o estado civil e contactos de familiares (cifrados, só a equipa os vê), o local de recolha e os dados de quem recebe em Angola. Depois de o pagamento ficar retido, as duas partes veem o contacto uma da outra até a entrega ser confirmada. O passaporte passou a ser obrigatório só para quem viaja. Passámos a pedir uma selfie a segurar o BI, que a equipa compara com o documento.</p>
          <p><b>15 de novembro de 2026.</b> Passámos a indicar o Sentry e o Resend entre os serviços que usamos, explicámos o aviso de documento repetido, as propostas de valor e a contagem temporária de tentativas.</p>
          <p><b>14 de novembro de 2026.</b> Primeira versão.</p>
        </div>
      </DocSection>
    </LegalLayout>
  );
}
