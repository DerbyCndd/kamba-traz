import Link from "next/link";
import { Bag } from "@/components/Bag";
import { FaqBlock } from "@/components/FaqBlock";
import { HowItWorks } from "@/components/HowItWorks";
import { Stars } from "@/components/Stars";
import { TopRated } from "@/components/TopRated";
import { getPreview } from "@/lib/data";
import { cityName, fdate, kz } from "@/lib/format";

/** Apresentação para quem ainda não tem sessão. Só mostra o essencial do quadro: rota, peso, data e valor (nunca nomes nem contactos). */
export async function Landing() {
  const { trips, reqs, tripCount, reqCount } = await getPreview();
  const hasBoard = trips.length + reqs.length > 0;
  return (
    <>
      <section className="hero">
        <div className="copy">
          <h1>Alguém voa para Luanda esta semana. Leva a tua encomenda.</h1>
          <p className="lead">Tens família ou negócio em Angola e uma encomenda para mandar? Quase sempre há alguém a voar. Nós tratamos de vos ligar e de acompanhar tudo, passo a passo.</p>
          <div className="row">
            <Link className="btn primary" href="/registo?para=pedir">Preciso de enviar</Link>
            <Link className="btn" href="/registo?para=viajar">Vou viajar</Link>
          </div>
          {tripCount + reqCount > 0 ? (
            <div className="counts">
              <div><b>{tripCount}</b><span className="label">viagens abertas</span></div>
              <div><b>{reqCount}</b><span className="label">pedidos à espera</span></div>
            </div>
          ) : null}
          <p className="hand note">Kamba, em kimbundu, quer dizer <u>amigo</u>. Aqui é o amigo que leva a tua encomenda.</p>
          <p className="hint">Para pedir ou publicar crias uma conta e confirmas o email. <Link href="/login">Já tenho conta</Link></p>
        </div>
        <div className="heroart">
          <Bag className="bag" />
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
        </div>
      </section>

      <section>
        <h2>Como funciona</h2>
        <HowItWorks />
      </section>

      <TopRated />

      {hasBoard ? (
        <>
          {trips.length ? (
            <section>
              <h2>Quem vai voar em breve</h2>
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
            </section>
          ) : null}
          {reqs.length ? (
            <section>
              <h2>Quem espera por um viajante</h2>
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
            </section>
          ) : null}
        </>
      ) : (
        <section className="start">
          <div>
            <h2>O quadro está a arrancar</h2>
            <p>Ainda não há viagens nem pedidos publicados. Podes ser a primeira pessoa a publicar, e nós vemos tudo com cuidado antes de aparecer.</p>
            <div className="row">
              <Link className="btn primary" href="/registo?para=pedir">Pedir um envio</Link>
              <Link className="btn" href="/registo?para=viajar">Publicar a minha viagem</Link>
            </div>
          </div>
          <Bag className="bag small" />
        </section>
      )}

      <section>
        <h2>Quem és tu?</h2>
        <div className="two voices">
          <div className="panel block red">
            <h3>Tens uma encomenda para mandar</h3>
            <p>Em vez de esperares semanas por um envio comercial, dizes o que queres enviar e quanto ofereces pelo transporte. A equipa liga-te a alguém que já vai viajar.</p>
            <Link className="btn primary" href="/registo?para=pedir" style={{ alignSelf: "flex-start" }}>Quero enviar</Link>
          </div>
          <div className="panel block blue">
            <h3>Vais voar para Angola</h3>
            <p>Sobra espaço na mala? Diz-nos quando viajas e quantos kg tens livres. Escolhes os pedidos que aceitas e recebes o valor combinado por cada volume.</p>
            <Link className="btn primary" href="/registo?para=viajar" style={{ alignSelf: "flex-start" }}>Quero levar</Link>
          </div>
        </div>
      </section>

      <section>
        <h2>Cuidamos de cada entrada, uma a uma</h2>
        <div className="panel dark care">
          <ul className="bullets">
            <li>Cada pedido e cada viagem é analisado por uma pessoa da equipa antes de aparecer no quadro.</li>
            <li>Quem leva as encomendas é identificado: a equipa confirma o passaporte e o bilhete de avião antes de publicar cada viagem.</li>
            <li>O teu número de telefone só a equipa o vê. No quadro aparece apenas o teu primeiro nome.</li>
            <li>Há uma lista de coisas que nunca transportamos.</li>
          </ul>
          <div className="row between">
            <Link className="btn small inverse" href="/regras">Ver o que nunca transportamos</Link>
            <span className="hand sign">A equipa Kamba Traz</span>
          </div>
        </div>
      </section>

      <FaqBlock />
    </>
  );
}
