import { CopyButton } from "@/components/CopyButton";
import { Faq } from "@/components/ui";

const PITCH: [string, string][] = [
  ["Gancho", "Quantas vezes ficaste semanas à espera de uma encomenda para Angola, ou pagaste uma fortuna para a enviar?"],
  ["Problema", "O correio expresso é caro e lento. Pedir a um conhecido que traga é barato, mas ninguém sabe em quem confiar."],
  ["Solução", "A Kamba Traz liga quem quer enviar a viajantes verificados que já têm a viagem marcada. O dinheiro fica em garantia e só é libertado quando a entrega é confirmada com um código."],
  ["Prova", "Começámos com a rota Lisboa–Luanda. [Escreve aqui o número real de entregas feitas.]"],
  ["Pedido", "Se vais a Luanda no próximo mês ou tens algo para enviar, diz-me e organizo-te a primeira entrega esta semana."],
];
const OBJ: [string, string][] = [
  ["“E se o viajante levar algo ilegal no meio?”", "Reconhece o risco. Explica que o volume é aberto e fotografado, a lista do conteúdo é aceite pelas duas partes e existe uma lista de itens proibidos. Propõe começar com um item pequeno e simples."],
  ["“Porque tenho de pagar a vocês e não ao viajante?”", "Porque o dinheiro só sai quando a entrega é confirmada. Sem isto, só tens a palavra de um desconhecido."],
  ["“Os preços do correio expresso são mais seguros.”", "Reconhece que é uma opção. Compara o custo por kg e o prazo na calculadora e deixa a decisão com o cliente."],
  ["“Não conheço ninguém que use isto.”", "Diz quantas entregas já foram feitas na rota dele e oferece-te a acompanhar a primeira pessoalmente."],
];

function MsgBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="msg">
      <h3>{title}</h3>
      <textarea readOnly aria-label={title} defaultValue={text} />
      <div className="row"><CopyButton text={text} /></div>
    </div>
  );
}

export function Pitch() {
  return (
    <div className="list">
      <div className="panel">
        <h3>Pitch de 30 segundos</h3>
        <p className="hint">Uma ideia por frase. Fala de pessoas e de dinheiro poupado, não de tecnologia. Treina em voz alta até caber em 30 segundos.</p>
        <div className="list">{PITCH.map(([k, t]) => <div key={k}><span className="label">{k}</span><p>{t}</p></div>)}</div>
        <div className="row"><CopyButton text={PITCH.map((p) => p[1]).join(" ")} label="Copiar pitch completo" /></div>
      </div>
      <div className="two">
        <div className="panel">
          <MsgBox title="Mensagem para viajantes" text="Olá! Vais viajar para Angola em breve? Tens espaço na mala que podes transformar em dinheiro. Na Kamba Traz publicas a tua viagem, escolhes os pedidos que aceitas e o pagamento fica garantido antes de levares. Diz-me a data e a rota e eu trato do resto." />
          <MsgBox title="Mensagem para quem quer enviar" text="Olá! Precisas de enviar algo para Angola? Na Kamba Traz ligamos-te a viajantes verificados que já têm voo marcado. Pagas em garantia e só libertamos o dinheiro depois da entrega confirmada. Diz-me o que é, o peso e de onde sai." />
        </div>
        <div className="panel">
          <MsgBox title="Depois da entrega (pedir testemunho)" text="Olá! A tua encomenda chegou bem? Se correu tudo bem, podes responder-me com uma frase sobre a experiência? Ajuda muito outras pessoas a confiar. E se conheceres alguém que vá viajar, diz-me." />
          <MsgBox title="Resposta a quem tem medo de ser enganado" text="Percebo a preocupação, e é por isso que o dinheiro fica connosco até a entrega ser confirmada. O viajante tem identidade e bilhete verificados, o volume é aberto e fotografado à tua frente, e tu dizes o código só quando recebes." />
        </div>
      </div>
      <div className="panel">
        <h3>Objecções e como responder</h3>
        <p className="hint">Método: reconhece, responde com um facto, propõe um passo pequeno.</p>
        <Faq items={OBJ} />
      </div>
    </div>
  );
}
