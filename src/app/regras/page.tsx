import type { Metadata } from "next";

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
            {["Drogas e substâncias controladas", "Armas, munições e réplicas", "Dinheiro em numerário e documentos de valor",
              "Baterias soltas, gás, líquidos inflamáveis e químicos", "Produtos falsificados", "Animais, plantas e alimentos perecíveis",
              "Qualquer volume fechado que o viajante não possa abrir"].map(li)}
          </ul>
        </div>
        <div className="panel warm">
          <h3>Só com confirmação da equipa</h3>
          <ul className="bullets">
            {["Electrónicos novos: telemóveis, portáteis, consolas", "Medicamentos: só com receita e para uso pessoal", "Itens de valor elevado",
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
        <p className="muted">Quem viaja é quem passa na alfândega, por isso estas regras protegem-no. Uma encomenda para outra pessoa não conta como «uso pessoal».</p>
        <div className="two">
          <ul className="bullets">
            {["À chegada a Luanda, quem leva encomendas de outras pessoas usa o canal vermelho e declara", "Até Kz 1 000 000 por viajante só há isenção para bens de uso pessoal, em quantidades reduzidas e sem carácter comercial",
              "Entre Kz 1 000 001 e Kz 1 500 000, a alfândega aplica 16% sobre o valor dos bens", "Acima de Kz 1 500 000 aplica o regime geral, com despachante: a Kamba não aceita"].map(li)}
          </ul>
          <ul className="bullets">
            {["Cada viagem leva no máximo Kz 1 500 000 em mercadoria, somando todos os pedidos", "Cada volume leva fatura ou valor declarado e lista do conteúdo",
              "Bebidas e tabaco têm limites muito pequenos na alfândega: não os levamos", "Perfumes levam-se, sempre declarados no canal vermelho e com fatura. Os 100 ml de perfume e 100 ml de água de toilette isentos são só para uso pessoal; acima disso paga-se imposto. Na bagagem despachada, as companhias costumam limitar cada frasco a 500 ml e o total a 2 litros por passageiro: confirma na tua", "Quem viaja em nome de uma empresa, ou leva muitas encomendas muitas vezes, passa a ser importador e deve falar com um despachante"].map(li)}
          </ul>
        </div>
        <p className="hint">Valores da pauta aduaneira de 2024 e do guia da AGT. Confirma sempre no <a href="https://agt.minfin.gov.ao" target="_blank" rel="noopener">portal da AGT</a> antes de viajar: as regras mudam e a Kamba não substitui o conselho de um despachante.</p>
      </div>
      <p className="hint">As regras da alfândega e das companhias aéreas mudam. Cada viajante é responsável por conhecer os limites da sua viagem antes de aceitar um pedido.</p>
    </section>
  );
}
