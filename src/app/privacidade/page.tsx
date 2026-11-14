import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Política de privacidade", description: "Que dados guardamos, porquê e quem os vê." };

/** Política de privacidade. Rascunho preparado para revisão por advogado antes de ser dado como definitivo. */
export default function PrivacidadePage() {
  return (
    <section className="doc">
      <h2>Política de privacidade</h2>
      <p className="muted">Versão de 14 de novembro de 2026. Explicamos que dados guardamos, para quê, quem os vê e que direitos tens.</p>

      <h3>1. Quem trata os teus dados</h3>
      <p>A Kamba Traz («Kamba») é a responsável pelo tratamento dos dados pessoais recolhidos nesta plataforma. Fala connosco pelo formulário de <Link href="/feedback">feedback</Link>.</p>

      <h3>2. Que dados recolhemos</h3>
      <table className="doctable">
        <thead><tr><th>Dados</th><th>Quando</th></tr></thead>
        <tbody>
          <tr><td>Nome, email e palavra-passe (guardada cifrada pelo serviço de autenticação)</td><td>No registo</td></tr>
          <tr><td>Telefone, número do BI, validade e fotos do BI; se quiseres, passaporte (número, validade e fotos)</td><td>Na identificação</td></tr>
          <tr><td>Foto de perfil</td><td>Se a juntares</td></tr>
          <tr><td>Rota, datas, peso, valor, descrição dos itens e fatura da compra</td><td>Nos pedidos e nas viagens</td></tr>
          <tr><td>Foto do bilhete de avião</td><td>Quem viaja</td></tr>
          <tr><td>Localização do telemóvel</td><td>Só quem leva a encomenda, enquanto ela está em trânsito</td></tr>
          <tr><td>Pagamentos e movimentos da carteira</td><td>Nas entregas</td></tr>
          <tr><td>Avaliações e mensagens de feedback</td><td>Quando as deixas</td></tr>
        </tbody>
      </table>

      <h3>3. Para que usamos</h3>
      <ul>
        <li>Identificar quem envia e quem viaja, para proteger as duas partes e prevenir fraude.</li>
        <li>Verificar documentos e datas de validade, e confirmar os bilhetes de avião.</li>
        <li>Juntar pedidos e viagens, acompanhar entregas e confirmar pagamentos.</li>
        <li>Cumprir obrigações legais (por exemplo, fiscais e de prevenção de branqueamento de capitais).</li>
        <li>Melhorar o serviço com o teu feedback.</li>
      </ul>
      <p>Tratamos os dados porque os forneces, para executar o serviço que pedes, para cumprir a lei e, quando a lei exigir, com o teu consentimento.</p>

      <h3>4. Quem vê os teus dados</h3>
      <ul>
        <li><b>A equipa da Kamba</b> vê os documentos, números e fotos. Cada abertura de um documento fica registada.</li>
        <li><b>A outra parte da entrega</b> só vê o que é preciso para a entrega acontecer, como o primeiro nome. Telefone, documentos e números nunca são partilhados com ela sem acordo.</li>
        <li><b>O público</b> só vê o primeiro nome, a rota e os valores de referência. Nunca contactos nem documentos.</li>
        <li><b>Prestadores que usamos:</b> a base de dados, a autenticação e o armazenamento de ficheiros são fornecidos pela Supabase; o alojamento do site, pela Vercel; os mapas, pelo OpenStreetMap. Estes serviços podem tratar dados em servidores fora de Angola.</li>
        <li>Podemos comunicar dados a autoridades quando a lei o exigir.</li>
      </ul>

      <h3>5. Como os protegemos</h3>
      <ul>
        <li>Os números do BI e do passaporte são cifrados antes de serem guardados. A chave não está na base de dados.</li>
        <li>As fotos de documentos, bilhetes e faturas ficam em espaço privado, com ligações temporárias só para a equipa.</li>
        <li>O acesso a cada tabela é limitado por regras: cada pessoa só vê o que é seu.</li>
        <li>Mesmo assim, nenhum sistema é perfeito. Se houver uma falha que afete os teus dados, avisamos-te.</li>
      </ul>

      <h3>6. Quanto tempo guardamos</h3>
      <p>Enquanto a tua conta existir e durante o tempo que a lei exigir depois disso (por exemplo, registos de pagamentos e de identificação para fins fiscais e de prevenção de fraude). A localização apaga-se quando a entrega termina.</p>

      <h3>7. Os teus direitos</h3>
      <p>Podes pedir para ver, corrigir ou apagar os teus dados, retirar o consentimento e opor-te a certos tratamentos, nos termos da Lei de Proteção de Dados Pessoais de Angola. Pede-o pelo formulário de <Link href="/feedback">feedback</Link>. Se achares que não cumprimos, podes queixar-te à Agência de Proteção de Dados (APD). Para pessoas que vivem na União Europeia aplica-se também o Regulamento Geral sobre a Proteção de Dados.</p>

      <h3>8. Cookies e armazenamento</h3>
      <p>Usamos só o que é necessário: o cookie de sessão (para manteres a conta iniciada) e a tua preferência de modo claro ou escuro. Não usamos publicidade nem seguimento.</p>

      <h3>9. Menores</h3>
      <p>A plataforma é só para maiores de 18 anos.</p>

      <h3>10. Alterações</h3>
      <p>Podemos atualizar esta política. A versão em vigor é a desta página, com a data no topo.</p>
    </section>
  );
}
