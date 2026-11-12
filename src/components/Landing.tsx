import Link from "next/link";
import { HowItWorks } from "@/components/HowItWorks";
import { Faq } from "@/components/ui";
import { FAQ } from "@/lib/faq";
import { getPreview } from "@/lib/data";
import { cityName, fdate, kz } from "@/lib/format";
import { Empty } from "@/components/ui";
import { Stars } from "@/components/Stars";
import { TopRated } from "@/components/TopRated";

/** Apresentação para quem ainda não tem sessão. Não mostra dados do quadro (esses são só para contas verificadas). */
export async function Landing() {
  const { trips, reqs, tripCount, reqCount } = await getPreview();
  return (
    <>
      <section className="hero">
        <div className="copy">
          <h1>Alguém voa para Luanda esta semana. Leva a tua encomenda.</h1>
          <p className="lead">A Kamba Traz liga quem precisa de enviar encomendas para Angola com quem já tem a viagem marcada. A equipa analisa cada entrada antes de a publicar.</p>
          <div className="row">
            <Link className="btn primary" href="/registo?para=pedir">Preciso de enviar</Link>
            <Link className="btn" href="/registo?para=viajar">Vou viajar</Link>
          </div>
          <div className="counts">
            <div><b>{tripCount}</b><span className="label">viagens abertas</span></div>
            <div><b>{reqCount}</b><span className="label">pedidos à espera</span></div>
          </div>
          <p className="hint">Para pedir ou publicar crias uma conta e confirmas o email. <Link href="/login">Já tenho conta</Link></p>
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

      <TopRated />

      <section>
        <h2>Próximas viagens</h2>
        {trips.length ? (
          <div className="grid">
            {trips.map((t, i) => (
              <article className="pass" key={i}>
                <div className="main">
                  <div className="route"><span>{t.origin}</span><span className="line" /><span>{t.destination}</span></div>
                  <div className="city">{cityName(t.origin)} para {cityName(t.destination)}</div>
                  <div className="facts">
                    <div><span className="label">Data</span><b>{fdate(t.travel_date)}</b></div>
                    <div><span className="label">Livre</span><b>{t.kg}&nbsp;kg</b></div>
                    <div><span className="label">Entregador</span><Stars avg={t.rating} count={t.rating_count} compact /></div>
                  </div>
                  {t.example ? <div className="row"><span className="pill ex">EXEMPLO</span></div> : null}
                </div>
                <div className="stub">
                  <div><span className="label">Por kg</span><div><b className="big">{kz(t.per_kg)}</b></div></div>
                  <Link className="btn small primary" href="/registo?para=pedir">Quero enviar</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="Ainda não há viagens publicadas" text="Vais viajar para Angola? Publica a tua viagem e começa a receber pedidos." cta="Publicar a minha viagem" href="/registo?para=viajar" />
        )}
      </section>

      <section>
        <h2>Pedidos à espera de viajante</h2>
        {reqs.length ? (
          <div className="grid tags">
            {reqs.map((r, i) => (
              <article className="bagtag" key={i}>
                <div className="head">
                  <div><span className="label">{r.origin} → {r.destination}</span><h3>{r.category}</h3></div>
                  {r.example ? <span className="pill ex">EXEMPLO</span> : null}
                </div>
                <div className="kv indent">
                  <div><span>Peso</span>{r.kg}&nbsp;kg</div>
                  <div><span>Oferta</span>{kz(r.offer)}</div>
                  {r.deadline ? <div><span>Até</span>{fdate(r.deadline)}</div> : null}
                  <div><span>Remetente</span><Stars avg={r.rating} count={r.rating_count} compact /></div>
                </div>
                <div className="indent"><Link className="btn small primary" href="/registo?para=viajar">Posso levar</Link></div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="Ainda não há pedidos publicados" text="Precisas de enviar algo para Angola? Faz o teu pedido e os viajantes vêem-no aqui." cta="Pedir um envio" href="/registo?para=pedir" />
        )}
      </section>

      <section>
        <h2>Para quem é</h2>
        <div className="two">
          <div className="panel block red">
            <h3>Recebe em dias, não em semanas</h3>
            <p>Publica o que queres enviar e oferece um valor pelo transporte. A equipa liga-te a quem já vai viajar.</p>
            <Link className="btn primary" href="/registo?para=pedir" style={{ alignSelf: "flex-start" }}>Pedir um envio</Link>
          </div>
          <div className="panel block blue">
            <h3>Rentabiliza o espaço livre na mala</h3>
            <p>Diz quando voas e quantos kg tens livres. Recebes o valor combinado por cada volume que levares.</p>
            <Link className="btn primary" href="/registo?para=viajar" style={{ alignSelf: "flex-start" }}>Publicar a minha viagem</Link>
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
