import { CopyButton } from "@/components/CopyButton";
import { Faq } from "@/components/ui";

const PITCH: [string, string][] = [
  ["Gancho", "Quantas vezes ficaste semanas à espera de uma encomenda para Angola, ou pagaste uma fortuna para a enviar?"],
  ["Problema", "O correio expresso é caro e lento. Pedir a um conhecido que traga é barato, mas ninguém sabe em quem confiar."],
  ["Solução", "A Kamba Traz liga quem quer enviar a viajantes que já têm a viagem marcada, depois de a equipa os conhecer: BI, selfie com o BI, passaporte, morada e família. O dinheiro fica connosco e só é libertado quando a entrega é confirmada com um código. Se algo correr mal, há um botão para nos contar."],
  ["Prova", "Começámos com a rota Lisboa–Luanda. [Escreve aqui o número real de entregas feitas.]"],
  ["Pedido", "Se vais a Luanda no próximo mês ou tens algo para enviar, diz-me e organizo-te a primeira entrega esta semana."],
];
const OBJ: [string, string][] = [
  ["“E se o viajante fugir com a encomenda?”", "Reconhece o risco: nenhum sistema o elimina. Diz que cada viajante é conhecido pela equipa (BI, selfie com o BI, passaporte, morada e familiares, comparados por pessoas), que o volume é aberto e fotografado, que o dinheiro só sai com o código de quem recebe, e que há avaliações e o selo «Conta de confiança». Não prometas um seguro: ainda não existe."],
  ["“E se eu combinar fora da app para poupar a taxa?”", "Explica o que se perde: sem a app não há dinheiro retido, nem código, nem denúncia à equipa, e a conta pode ser suspensa. Os contactos só se mostram depois de o pagamento ficar retido, e esse é o ponto: primeiro paga-se em segurança, depois falam-se."],
  ["“Não quero dar a minha morada a desconhecidos.”", "Percebe. A morada e os familiares ficam cifrados e só a equipa os abre, em caso de emergência ou fraude. Quem envia pode escolher levar a encomenda ao entregador em vez de dar a sua morada, e o entregador só vê o local de recolha depois de o pagamento ficar retido."],
  ["“E se o viajante levar algo ilegal no meio?”", "Reconhece o risco. Explica que o volume é aberto e fotografado, a lista do conteúdo é aceite pelas duas partes e existe uma lista de itens proibidos. Propõe começar com um item pequeno e simples."],
  ["“Porque tenho de pagar a vocês e não ao viajante?”", "Porque o dinheiro só sai quando a entrega é confirmada. Sem isto, só tens a palavra de um desconhecido. Hoje o pagamento é feito à equipa e registado por ela; diz-lhe como pagar quando a entrega for criada."],
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
          <MsgBox title="Mensagem para viajantes" text="Olá! Vais viajar para Angola em breve? Tens espaço na mala que podes transformar em dinheiro. Na Kamba Traz publicas a tua viagem, escolhes os pedidos que aceitas e o pagamento fica retido antes de levares. Podes até indicar onde recebes encomendas, para te levarem a ti. Precisas do passaporte registado. Diz-me a data e a rota e eu trato do resto." />
          <MsgBox title="Mensagem para quem quer enviar" text="Olá! Precisas de enviar algo para Angola? Na Kamba Traz ligamos-te a viajantes que já têm voo marcado e que a equipa conhece. Pagas e o dinheiro fica retido até a entrega ser confirmada com um código. Podes pedir que o entregador vá buscar, ou levar tu a encomenda a ele. Diz-me o que é, o peso e de onde sai." />
        </div>
        <div className="panel">
          <MsgBox title="Depois da entrega (pedir testemunho)" text="Olá! A tua encomenda chegou bem? Se correu tudo bem, podes responder-me com uma frase sobre a experiência? Ajuda muito outras pessoas a confiar. E se conheceres alguém que vá viajar, diz-me." />
          <MsgBox title="Resposta a quem tem medo de ser enganado" text="Percebo a preocupação, e é por isso que o dinheiro fica connosco até a entrega ser confirmada. A equipa conhece o viajante (BI, selfie com o BI, passaporte, bilhete, morada e família), o volume é aberto e fotografado à tua frente, e o código só o dá quem recebe. Se algo correr mal, podes denunciar na app e a equipa trata. Seguro ainda não temos, e prefiro dizer-te isso já." />
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
