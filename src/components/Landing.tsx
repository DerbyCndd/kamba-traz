import Link from "next/link";
import { HowItWorks } from "@/components/HowItWorks";
import { Faq } from "@/components/ui";
import { FAQ } from "@/lib/faq";

/** Apresentação para quem ainda não tem sessão. Não mostra dados do quadro (esses são só para contas verificadas). */
export function Landing() {
  return (
    <>
      <section className="hero">
        <div className="copy">
          <h1>Alguém voa para Luanda esta semana. Leva a tua encomenda.</h1>
          <p className="lead">A Kamba Traz liga quem precisa de enviar encomendas para Angola com quem já tem a viagem marcada. A equipa analisa cada entrada antes de a publicar.</p>
          <div className="row">
            <Link className="btn primary" href="/registo">Criar conta grátis</Link>
            <Link className="btn" href="/login">Já tenho conta</Link>
          </div>
          <p className="hint">Só contas com email verificado vêem o quadro e publicam.</p>
        </div>
        <article className="pass" aria-label="Exemplo de bilhete de viagem">
          <div className="main">
            <div className="route"><span>LIS</span><span className="line" /><span>LAD</span></div>
            <div className="city">Lisboa para Luanda</div>
            <div className="facts">
              <div><span className="label">Espaço livre</span><b>10&nbsp;kg</b></div>
              <div><span className="label">Estado</span><b>Analisada pela equipa</b></div>
            </div>
            <div className="row"><span className="pill ex">EXEMPLO</span></div>
          </div>
          <div className="stub">
            <div><span className="label">Preço por kg</span><div><b className="big">A combinar</b></div></div>
          </div>
        </article>
      </section>

      <section>
        <h2>Como funciona</h2>
        <HowItWorks />
      </section>

      <section>
        <h2>Para quem é</h2>
        <div className="two">
          <div className="panel warm">
            <h3>Recebe em dias, não em semanas</h3>
            <p className="muted">Publica o que queres enviar e oferece um valor pelo transporte. A equipa liga-te a quem já vai viajar.</p>
            <Link className="btn primary" href="/registo" style={{ alignSelf: "flex-start" }}>Pedir um envio</Link>
          </div>
          <div className="panel">
            <h3>Rentabiliza o espaço livre na mala</h3>
            <p className="muted">Diz quando voas e quantos kg tens livres. Recebes o valor combinado por cada volume que levares.</p>
            <Link className="btn" href="/registo" style={{ alignSelf: "flex-start" }}>Publicar a minha viagem</Link>
          </div>
        </div>
      </section>

      <section>
        <h2>Como cuidamos de cada entrada</h2>
        <div className="panel dark">
          <ul className="bullets">
            <li>Cada pedido e cada viagem é analisado pela equipa antes de aparecer no quadro.</li>
            <li>O teu número de telefone só a equipa o vê. No quadro aparece apenas o primeiro nome.</li>
            <li>Há uma lista de itens que nunca transportamos.</li>
          </ul>
          <Link className="btn small inverse" href="/regras" style={{ alignSelf: "flex-start" }}>Ver o que nunca transportamos</Link>
        </div>
      </section>

      <section>
        <h2>Perguntas frequentes</h2>
        <Faq items={FAQ} />
      </section>
    </>
  );
}
