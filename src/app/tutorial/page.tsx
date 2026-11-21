import type { Metadata } from "next";
import Link from "next/link";
import { StepArt, type Art } from "@/components/StepArt";

export const metadata: Metadata = {
  title: "Como usar a Kamba Traz",
  description: "Passo a passo, com imagens, para quem quer enviar uma encomenda para Angola e para quem viaja e leva.",
};

type Step = { title: string; text: string; tips?: string[]; art: Art };

const START: Step[] = [
  {
    title: "Cria a tua conta",
    text: "Em «Registo», escreve o teu nome, o email e uma palavra-passe. Abre o email que te enviamos e confirma. Sem confirmar o email, não consegues entrar.",
    art: { kind: "form", title: "Criar conta", fields: ["O teu nome", "Email", "Palavra-passe"], button: "Criar conta", focus: 1 },
  },
  {
    title: "Faz a tua identificação",
    text: "Pedimos uma só vez, e serve para enviar e para viajar: o nome como está no BI, o telefone com indicativo, o número e a validade do BI e as fotos da frente e do verso. Quem vai viajar junta também o passaporte (número, validade, 2.ª página e última página).",
    tips: ["Tira as fotos com boa luz, sem reflexos, e confirma que o nome e o número se leem.", "Cada pessoa tem uma só conta, com os seus próprios documentos."],
    art: { kind: "form", title: "Identificação", fields: ["Número do BI", "Validade do BI", "Foto do BI: frente"], button: "Guardar identificação", focus: 2 },
  },
  {
    title: "Completa a segurança da conta",
    text: "Indica a tua morada, o estado civil e o contacto de um familiar (a mãe, o pai ou o cônjuge), e envia uma selfie a segurar o BI aberto ao lado do rosto. Protege quem envia e quem viaja.",
    tips: ["Só a equipa vê estes dados, cifrados. Só contactamos os familiares em caso de emergência ou de suspeita de fraude.", "Confirma que tens autorização dos familiares para dar o contacto deles."],
    art: { kind: "form", title: "Segurança da conta", fields: ["Morada completa", "Familiar: telefone", "Selfie com o BI"], button: "Guardar e continuar", focus: 2 },
  },
  {
    title: "A equipa confirma",
    text: "A equipa compara o teu rosto com o BI e confere os documentos. Enquanto a identificação não estiver confirmada, os teus pedidos e viagens esperam. Vês o estado em «Meu perfil».",
    art: { kind: "list", title: "Meu perfil", items: [{ a: "Identificação", b: "BI, selfie e morada", pill: "Confirmada", tone: "ok" }, { a: "Passaporte", b: "Só para quem viaja", pill: "Por confirmar", tone: "warn" }], focus: 0 },
  },
];

const SEND: Step[] = [
  {
    title: "Faz o pedido de envio",
    text: "Em «Pedir envio», diz o que envias, o tipo, o peso e o valor do item. Escolhe a moeda do país de onde sai: a Kamba Traz converte para euros, porque a alfândega e os nossos limites calculam-se numa só moeda. Escolhe como a encomenda chega ao entregador (ele vem buscar, ou levas tu) e indica quem a recebe em Angola.",
    tips: ["Eletrónicos, cosméticos (perfumes), peças e qualquer item acima de 300 € levam a fatura da compra.", "Contas novas têm um limite de valor por pedido. Acima dele, marca o pedido como urgente e explica porquê, para a equipa decidir.", "Não escrevas telefones, emails nem ligações na descrição: ficam visíveis a todos."],
    art: { kind: "form", title: "Pedir envio", fields: ["O que queres enviar", "Moeda e valor do item", "Quem recebe em Angola"], button: "Enviar pedido", focus: 1 },
  },
  {
    title: "A equipa aprova e publica",
    text: "A equipa verifica o pedido e publica-o no quadro, só com o teu primeiro nome, a rota e o peso. Os teus contactos não são públicos.",
    art: { kind: "list", title: "Quadro", items: [{ a: "Telemóvel, 0,5 kg", b: "Lisboa → Luanda", pill: "Aberto", tone: "ok" }, { a: "Roupa, 4 kg", b: "Porto → Luanda", pill: "Aberto", tone: "ok" }], focus: 0 },
  },
  {
    title: "Combinam o valor em «Propostas»",
    text: "Quando houver um viajante compatível, combinam o valor sem trocar mensagens: cada parte propõe um valor, e a outra aceita, recusa ou propõe outro. Antes de aceitar, vês a reputação da outra pessoa: avaliações, entregas concluídas e se a identificação está confirmada.",
    art: { kind: "list", title: "Propostas", items: [{ a: "Proposta de Ana", b: "45 000 Kz · ★ 4,8 · identificação confirmada", pill: "À espera", tone: "warn" }, { a: "A tua proposta", b: "40 000 Kz", pill: "Recusada", tone: "info" }], focus: 0 },
  },
  {
    title: "Pagas à equipa e o valor fica retido",
    text: "Depois do acordo, a equipa cria a entrega e diz-te como pagar (transferência, Multicaixa Express ou numerário). Pagas só à equipa, nunca ao viajante. Quando a equipa confirma o pagamento, o valor fica retido e aparece o teu código de entrega.",
    tips: ["O valor só é libertado ao viajante quando a entrega é confirmada com o código."],
    art: { kind: "code", title: "Entrega", label: "O teu código de entrega", digits: "482190", hint: "Só o dás a quem recebe, no fim" },
  },
  {
    title: "Contactos e recolha",
    text: "Com o pagamento retido, vês o contacto do entregador (e, se escolheste levar tu a encomenda, onde ele recebe). Combinem a hora. O entregador abre o volume à tua frente, confere o conteúdo, fotografa e sela. Entrega só o que declaraste.",
    tips: ["Os contactos só aparecem com o pagamento retido, e deixam de aparecer quando a entrega termina.", "Fora da app não há pagamento retido, nem código, nem denúncia à equipa. Não pagues nem entregues nada fora daqui."],
    art: { kind: "photos", title: "Fotos do volume", button: "Selar o volume", note: "Pelo menos 2 fotos, tiradas à tua frente" },
  },
  {
    title: "Acompanha e recebe",
    text: "Com a encomenda a caminho, vês o entregador no mapa. Quem recebe em Angola dá o código ao entregador só quando tiver a encomenda na mão. A localização é apagada quando a entrega termina.",
    art: { kind: "map", title: "A caminho", caption: "Entregador a caminho de Luanda" },
  },
  {
    title: "Avalia",
    text: "A entrega fica concluída e o valor é libertado ao viajante. Os dois avaliam-se, de 1 a 5 estrelas. Boas avaliações ajudam todos a confiar, e quem tem 3 entregas, boa média e identificação confirmada recebe o selo «Conta de confiança».",
    art: { kind: "check", title: "Entrega", message: "Entrega concluída" },
  },
];

const TRAVEL: Step[] = [
  {
    title: "Regista a tua viagem",
    text: "Em «Vou viajar», indica a rota, as datas de ida e regresso, o voo, os quilos livres, o preço por kg e a foto do bilhete (com o teu nome e as datas). Precisas de ter o passaporte registado. Se preferires que te levem a encomenda, indica onde a recebes (é opcional).",
    tips: ["Só quem envia vê onde recebes, depois de o pagamento ficar retido."],
    art: { kind: "form", title: "Vou viajar", fields: ["Rota e datas", "Espaço e preço por kg", "Foto do bilhete de avião"], button: "Enviar viagem", focus: 2 },
  },
  {
    title: "A equipa confirma e publica",
    text: "A equipa confere o bilhete e a identificação, e publica a viagem no quadro só com o teu primeiro nome.",
    art: { kind: "list", title: "Meus registos", items: [{ a: "Viagem Lisboa → Luanda", b: "Bilhete e identificação", pill: "Em verificação", tone: "warn" }, { a: "Viagem Porto → Luanda", b: "12 kg livres", pill: "Aberta", tone: "ok" }], focus: 0 },
  },
  {
    title: "Escolhe pedidos e propõe um valor",
    text: "No quadro vês os pedidos compatíveis com a tua rota. Em «Propostas», propões um valor e a outra parte aceita, recusa ou propõe outro. Antes de aceitar, vês a reputação de quem envia.",
    art: { kind: "list", title: "Propostas", items: [{ a: "Pedido de Carlos", b: "Telemóvel, 0,5 kg · 40 000 Kz", pill: "Acordo", tone: "ok" }, { a: "Pedido de Maria", b: "Roupa, 4 kg · 35 000 Kz", pill: "À espera", tone: "warn" }], focus: 0 },
  },
  {
    title: "Só levas com o pagamento retido",
    text: "A página da entrega diz «O pagamento está retido. Podes pegar a encomenda» quando a equipa confirma o pagamento de quem envia. Só então vês o contacto de quem envia, onde pegar a encomenda e quem a recebe em Angola. Antes disso, não pegues em nada.",
    art: { kind: "list", title: "Entrega", items: [{ a: "Pagamento", b: "Retido na app", pill: "Retido", tone: "ok" }, { a: "Encomenda", b: "Podes pegar", pill: "Pegar", tone: "info" }], focus: 0 },
  },
  {
    title: "Pega na encomenda",
    text: "Abre o volume com quem envia, confere o que lá está e recusa o que for suspeito ou não estiver na lista. Tira pelo menos 2 fotos e envia-as pela app, sela o volume e carrega em «Pegar a encomenda». Aceitas partilhar a tua localização só enquanto levas a encomenda.",
    tips: ["Declara a mercadoria na alfândega e não abras o volume depois de selado."],
    art: { kind: "photos", title: "Fotos do volume", button: "Pegar a encomenda", note: "Envia as fotos antes de pegar" },
  },
  {
    title: "Entrega com o código",
    text: "Quando chegares, pede a quem recebe o código de 6 dígitos e escreve-o em «Confirmar entrega». Sem o código, não entregues a encomenda.",
    art: { kind: "code", title: "Confirmar entrega", label: "Código de quem recebe", digits: "482190", hint: "Só entregas a quem tiver o código" },
  },
  {
    title: "Recebes o pagamento e avalias",
    text: "Com a entrega confirmada, a equipa paga-te o valor combinado menos a comissão e marca como pago. Vês tudo em «Carteira». Depois, avalia quem enviou.",
    art: { kind: "check", title: "Carteira", message: "Entrega confirmada" },
  },
];

function Steps({ steps, id }: { steps: Step[]; id: string }) {
  return (
    <ol className="tsteps" id={id}>
      {steps.map((s, i) => (
        <li className="tstep" key={s.title}>
          <div className="ttext">
            <span className="tnum" aria-hidden="true">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            {s.tips?.length ? <ul className="ttips">{s.tips.map((t) => <li key={t}>{t}</li>)}</ul> : null}
          </div>
          <StepArt art={s.art} label={`Ilustração do passo ${i + 1}: ${s.title}`} />
        </li>
      ))}
    </ol>
  );
}

export default function TutorialPage() {
  return (
    <section className="tut">
      <h2>Como usar a Kamba Traz</h2>
      <p className="muted">Passo a passo, para quem quer enviar uma encomenda para Angola e para quem viaja e leva. As imagens são ilustrações simplificadas dos ecrãs, com dados de exemplo.</p>
      <nav className="row" aria-label="Saltar para">
        <a className="btn small" href="#comeco">Para todos: começar</a>
        <a className="btn small" href="#enviar">Se vais enviar</a>
        <a className="btn small" href="#viajar">Se vais viajar</a>
        <a className="btn small" href="#regras">Regras de ouro</a>
      </nav>

      <h3 className="tsec">Para todos: começar</h3>
      <Steps steps={START} id="comeco" />

      <h3 className="tsec">Se vais enviar uma encomenda</h3>
      <Steps steps={SEND} id="enviar" />

      <h3 className="tsec">Se vais viajar e levar</h3>
      <Steps steps={TRAVEL} id="viajar" />

      <div className="panel" id="regras">
        <h3>Regras de ouro</h3>
        <ul className="bullets">
          <li><b>Paga só à equipa, dentro da app.</b> Fora dela não há pagamento retido, nem código, nem denúncia, e a conta pode ser suspensa.</li>
          <li><b>O código de entrega é como uma chave.</b> Quem envia guarda-o, e só quem recebe o diz ao entregador, quando tiver a encomenda na mão.</li>
          <li><b>Só se leva o que se viu.</b> O volume abre-se, confere-se e fotografa-se antes de selar. Medicamentos, bebidas alcoólicas e tabaco não se levam. <Link href="/regras">Ver a lista completa</Link></li>
          <li><b>Faturas.</b> Eletrónicos, cosméticos (perfumes), peças e itens acima de 300 € levam fatura da compra.</li>
          <li><b>Se algo correr mal,</b> usa «Denunciar um problema» na página da entrega. Só a equipa lê.</li>
        </ul>
      </div>

      <div className="row">
        <Link className="btn primary" href="/registo">Criar conta</Link>
        <Link className="btn" href="/quadro">Ver o quadro</Link>
        <Link className="btn" href="/feedback">Tenho uma dúvida</Link>
      </div>
    </section>
  );
}
