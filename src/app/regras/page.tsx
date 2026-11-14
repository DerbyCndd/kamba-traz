import type { Metadata } from "next";
import Link from "next/link";
import { Src } from "@/components/Src";

export const metadata: Metadata = { title: "Regras" };

const li = (t: string) => <li key={t}>{t}</li>;

export default function RegrasPage() {
  return (
    <section>
      <h2>Regras de segurança</h2>
      <p className="muted">Estas regras protegem quem envia, quem leva e a própria plataforma. Quem as quebrar é removido.</p>
      <div className="two">
        <div className="panel forbid">
          <h3>Nunca transportamos</h3>
          <ul className="bullets">
            {["Drogas e substâncias controladas", "Armas, munições e réplicas", "Dinheiro em numerário e documentos de valor", "Medicamentos",
              "Baterias soltas, gás, líquidos inflamáveis e químicos", "Produtos falsificados", "Animais, plantas e alimentos perecíveis",
              "Qualquer volume fechado que o viajante não possa abrir"].map(li)}
          </ul>
        </div>
        <div className="panel warm">
          <h3>Só com confirmação da equipa</h3>
          <ul className="bullets">
            {["Electrónicos novos: telemóveis, portáteis, consolas", "Itens de valor elevado",
              "Peças e ferramentas", "Tudo o que tenha limites de peso, quantidade ou valor na alfândega angolana ou na companhia aérea"].map(li)}
          </ul>
        </div>
      </div>
      <div className="panel">
        <h3>Como cuidamos de cada entrega</h3>
        <div className="two">
          <ul className="bullets">
            {["Cada viagem e cada pedido é analisado pela equipa antes de aparecer no quadro", "Volume aberto, fotografado e selado na presença de quem envia",
              "Lista do conteúdo escrita e aceite pelas duas partes"].map(li)}
          </ul>
          <ul className="bullets">
            {["O pagamento é confirmado pela equipa e fica retido na carteira até a entrega ser confirmada com o código", "Quem recebe confirma o estado do volume no momento",
              "Em caso de problema, a equipa analisa as fotos e o histórico"].map(li)}
          </ul>
        </div>
      </div>
      <div className="panel" id="alfandega">
        <h3>Alfândega em Angola</h3>
        <p className="muted">Quem viaja é quem passa na alfândega, por isso estas regras protegem-no. Cada ponto da lei traz a fonte; o que é decisão nossa está à parte.</p>
        <div className="two">
          <div>
            <h4 className="lawtitle">O que diz a lei</h4>
            <ul className="bullets lawlist">
              <li>Só há isenção para bens «destinados ao consumo pessoal» do viajante, em quantidades reduzidas, sem características comerciais e até Kz 1 000 000. <Src refs={[["dlp", "art. 1.º, k) e art. 12.º, n.º 1"], ["guia", "ponto 2.2"]]} /></li>
              <li>Entre Kz 1 000 001 e Kz 1 500 000 aplica-se uma taxa fixa de 16% sobre o valor. <Src refs={[["dlp", "art. 12.º, n.º 2"], ["guia", "ponto 2.3"]]} /></li>
              <li>Acima de Kz 1 500 000, e nos bens de pessoas coletivas, aplica-se o regime geral. <Src refs={[["dlp", "art. 12.º, n.os 6 e 7"], ["guia", "ponto 2.3"]]} /></li>
              <li>Quem leva bens que não são de uso pessoal, ou tem dúvidas, usa o canal vermelho. <Src refs={[["guia", "ponto 2.1.1.2"]]} /></li>
              <li>Há limites pequenos para bebidas, tabaco e perfumes (por exemplo, 100 ml de perfume). <Src refs={[["guia", "ponto 2.3"]]} /></li>
              <li>Medicamentos são mercadoria de importação restrita: só com autorização prévia. <Src refs={[["dlp", "Quadro II, art. 60.º"]]} /></li>
              <li>Quem representa terceiros na declaração aduaneira são os despachantes. <Src refs={[["guia", "ponto 2.7"]]} /></li>
            </ul>
          </div>
          <div>
            <h4 className="lawtitle">O que fazemos por isso</h4>
            <ul className="bullets lawlist">
              <li>A lei não fala de bens trazidos para outras pessoas. Por prudência, tratamos essas encomendas como não isentas: o viajante declara no canal vermelho.</li>
              <li>Cada viagem leva no máximo Kz 1 500 000 em mercadoria, somando todos os pedidos. Ficamos sempre abaixo do regime geral.</li>
              <li>Cada volume leva lista do conteúdo. Eletrónicos, cosméticos e perfumes, peças e itens acima de 300 € levam a fatura da compra.</li>
              <li>Bebidas e tabaco não se levam. Medicamentos são proibidos.</li>
              <li>Perfumes levam-se, declarados e com fatura. As companhias aéreas têm regras próprias para líquidos: confirma na tua.</li>
              <li>Se levas encomendas com muita frequência, fala com um despachante antes de viajar: pode ser tratado como atividade comercial.</li>
            </ul>
          </div>
        </div>
        <p className="hint">Confirma sempre no <a href="https://agt.minfin.gov.ao" target="_blank" rel="noopener noreferrer">portal da AGT</a> antes de viajar: as regras mudam e a Kamba não substitui um despachante. Todas as fontes, e o que é leitura nossa, estão em <Link href="/fontes">Fontes</Link>.</p>
      </div>
      <p className="hint">As regras da alfândega e das companhias aéreas mudam. Cada viajante é responsável por conhecer os limites da sua viagem antes de aceitar um pedido.</p>
    </section>
  );
}
