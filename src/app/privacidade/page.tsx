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
  { icon: "idcard", title: "Pedimos o mínimo.", text: "Telefone e BI são obrigatórios. Passaporte e foto de perfil são opcionais." },
  { icon: "pin", title: "A localização só existe durante a entrega.", text: "É apagada quando a entrega termina." },
  { icon: "key", title: "Mandas tu.", text: "Podes pedir para ver, corrigir ou apagar os teus dados." },
];

const ROWS: [string, string, string][] = [
  ["Nome, email, palavra-passe", "Obrigatório", "Criar e proteger a tua conta. A palavra-passe é guardada cifrada."],
  ["Telefone", "Obrigatório", "A equipa fala contigo sobre pedidos e entregas."],
  ["Número, validade e fotos do BI", "Obrigatório", "Saber quem envia e quem viaja, e prevenir fraude."],
  ["Passaporte (número, validade, fotos)", "Opcional", "Ajuda a confirmar quem viaja. Só se quiseres."],
  ["Foto de perfil", "Opcional", "A equipa reconhece-te melhor."],
  ["Foto do bilhete de avião e datas", "Obrigatório para quem viaja", "Confirmar que a viagem existe."],
  ["Rota, peso, valor e descrição do item; fatura", "Obrigatório para quem envia", "Juntar pedidos a viagens e cumprir a alfândega."],
  ["Localização do telemóvel", "Só quem leva a encomenda, e só em trânsito", "Quem enviou acompanha a entrega no mapa."],
  ["Pagamentos e movimentos da carteira", "Obrigatório nas entregas", "Reter e pagar os valores, e guardar o registo."],
  ["Avaliações e feedback", "Opcional", "Melhorar o serviço e dar confiança às duas partes."],
];

/** Política de privacidade. Rascunho preparado para revisão por advogado antes de ser dado como definitivo. */
export default function PrivacidadePage() {
  return (
    <LegalLayout
      title="Política de privacidade"
      version="14 de novembro de 2026"
      readMin={4}
      intro="Explicamos que dados guardamos, para quê, quem os vê e como os podes ver, corrigir ou apagar."
      summary={SUMMARY}
      toc={TOC}
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
          <li><b>A outra parte da entrega</b> vê só o que é preciso para a entrega acontecer, como o primeiro nome. O telefone, os documentos e os números não são partilhados com ela sem acordo.</li>
          <li><b>A equipa da Kamba</b> vê os documentos, os números e as fotos, para confirmar a identificação. Cada abertura de um documento fica registada.</li>
          <li><b>Serviços que usamos para funcionar:</b> a Supabase (base de dados, autenticação e ficheiros), a Vercel (alojamento do site) e o OpenStreetMap (mapas). Podem tratar dados em servidores fora de Angola.</li>
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
          <li><b>Fotos privadas.</b> Documentos, bilhetes e faturas ficam num espaço privado, com ligações temporárias que só a equipa usa.</li>
          <li><b>Acesso limitado.</b> Cada pessoa só vê o que é seu.</li>
          <li><b>Se algo correr mal.</b> Nenhum sistema é perfeito. Se uma falha afetar os teus dados, avisamos-te.</li>
        </ul>
      </DocSection>

      <DocSection id="tempo" n={6} title="Quanto tempo guardamos">
        <ul>
          <li><b>Localização:</b> apagada quando a entrega termina.</li>
          <li><b>Conta, documentos e fotos:</b> enquanto a conta existir. Se a apagares, apagamos os teus documentos e as tuas fotos, exceto o que a lei nos obrigue a guardar (por exemplo, registos de pagamentos e de identificação para fins fiscais e de prevenção de fraude).</li>
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
        <p>A plataforma é só para maiores de 18 anos. Podemos atualizar esta política: a versão em vigor é a desta página, com a data no topo, e o que mudou fica registado em baixo. Ver também os <Link href="/termos">termos de uso</Link>.</p>
        <div className="docversions">
          <p className="itl">O que mudou</p>
          <p><b>14 de novembro de 2026.</b> Primeira versão.</p>
        </div>
      </DocSection>
    </LegalLayout>
  );
}
