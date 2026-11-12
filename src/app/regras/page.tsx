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
            {["Combina o pagamento com a equipa antes de enviar (a garantia de pagamento está em preparação)", "Quem recebe confirma o estado do volume no momento",
              "Em caso de problema, a equipa analisa as fotos e o histórico"].map(li)}
          </ul>
        </div>
      </div>
      <p className="hint">As regras da alfândega e das companhias aéreas mudam. Cada viajante é responsável por conhecer os limites da sua viagem antes de aceitar um pedido.</p>
    </section>
  );
}
