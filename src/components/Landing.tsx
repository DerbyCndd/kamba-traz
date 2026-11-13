import Link from "next/link";
import { Bag } from "@/components/Bag";
import { Calculator } from "@/components/Calculator";
import { FaqBlock } from "@/components/FaqBlock";
import { HowItWorks } from "@/components/HowItWorks";
import { Icon } from "@/components/Icons";
import { Stars } from "@/components/Stars";
import { TopRated } from "@/components/TopRated";
import { getPreview, getPublicPricing } from "@/lib/data";
import { cityName, fdate, kz } from "@/lib/format";

const Check = ({ children }: { children: React.ReactNode }) => (
  <li><span className="tick"><Icon name="check" size={14} /></span><span>{children}</span></li>
);

/** Exemplos de cartão, só para mostrar como fica. Estão marcados como exemplo. */
function MockRequest() {
  return (
    <div className="mockwrap" role="img" aria-label="Exemplo de um pedido de envio no quadro">
      <article className="bagtag">
        <div className="head"><div><span className="label">LIS → LAD</span><h3>Roupa e calçado</h3></div><span className="pill ex">exemplo</span></div>
        <div className="kv"><div><span>Peso</span>4 kg</div><div><span>Oferta</span>a combinar</div></div>
        <span className="btn small primary" aria-hidden="true">Posso levar</span>
      </article>
    </div>
  );
}
function MockTrip() {
  return (
    <div className="mockwrap" role="img" aria-label="Exemplo de uma viagem no quadro">
      <article className="pass">
        <div className="main">
          <div className="route"><span>LIS</span><span className="line" /><span>LAD</span></div>
          <div className="city">Lisboa para Luanda</div>
          <div className="facts"><div><span className="label">Espaço livre</span><b>10 kg</b></div><div><span className="label">Preço por kg</span><b>a definir</b></div><div><span className="label">Estado</span><b>Confirmada</b></div></div>
          <div className="row"><span className="pill ex">exemplo</span></div>
        </div>
      </article>
    </div>
  );
}

/** Para quem ainda não tem sessão. O quadro mostra só rota, peso, data e valor (nunca nomes nem contactos). */
export async function Landing() {
  const [{ trips, reqs }, pricing] = await Promise.all([getPreview(), getPublicPricing()]);
  return (
    <>
      <section className="hero">
        <div className="copy">
          <h1>Encomendas para Angola, na mala de quem já vai.</h1>
          <p className="lead">A Kamba Traz liga quem precisa de enviar uma encomenda para Angola a quem já tem a viagem marcada. Chega em dias, com a equipa a confirmar cada passo.</p>
          <div className="row">
            <Link className="btn primary" href="/registo?para=pedir">Quero enviar</Link>
            <Link className="btn" href="/registo?para=viajar">Vou viajar</Link>
          </div>
          <ul className="trust">
            <li><Icon name="idcard" size={18} />Viajantes identificados</li>
            <li><Icon name="lock" size={18} />Contactos privados</li>
            <li><Icon name="team" size={18} />Equipa que acompanha</li>
          </ul>
        </div>
        <div className="heroside">
          {pricing
            ? <Calculator perKg={pricing.per_kg} commission={pricing.commission} cta={<Link className="btn primary block" href="/registo?para=pedir">Quero enviar</Link>} />
            : <Bag className="bag" />}
        </div>
      </section>

      <section id="como-funciona">
        <div className="sechead">
          <h2>Como funciona</h2>
          <p className="muted">Do pedido à entrega, em três passos.</p>
        </div>
        <HowItWorks />
      </section>

      <section className="split">
        <div className="text">
          <h2>Recebe em dias, não em semanas.</h2>
          <p className="muted">Em vez de esperares semanas por um envio comercial, publicas o que queres enviar e dizes quanto ofereces pelo transporte. A equipa liga-te a alguém que já vai viajar.</p>
          <ul className="ticks">
            <Check>Escolhes o valor que ofereces pelo transporte.</Check>
            <Check>O pedido só aparece no quadro depois de a equipa o confirmar.</Check>
            <Check>O teu número de telefone nunca é público.</Check>
          </ul>
          <div className="row"><Link className="btn primary" href="/registo?para=pedir">Quero enviar</Link></div>
        </div>
        <MockRequest />
      </section>

      <section className="split rev">
        <div className="text">
          <h2>Transforma o espaço livre da mala em receita.</h2>
          <p className="muted">Já tens a viagem marcada? Diz-nos quando voas e quantos kg te sobram. Escolhes os pedidos que aceitas e recebes o valor combinado por cada volume.</p>
          <ul className="ticks">
            <Check>Defines tu o preço por kg.</Check>
            <Check>Cada volume é aberto e fotografado junto de quem envia.</Check>
            <Check>O valor fica retido na carteira e chega-te quando a entrega é confirmada.</Check>
            <Check>A equipa confirma o teu BI e o bilhete antes de publicar a viagem.</Check>
          </ul>
          <div className="row"><Link className="btn primary" href="/registo?para=viajar">Publicar a minha viagem</Link></div>
        </div>
        <MockTrip />
      </section>

      {trips.length ? (
        <section>
          <div className="sechead"><h2>Próximas viagens</h2><p className="muted">Viagens já confirmadas pela equipa.</p></div>
          <div className="rows">
            {trips.map((t, i) => (
              <div className="r" key={i}>
                <div><b>{cityName(t.origin)} → {cityName(t.destination)}</b><span className="sub">{fdate(t.travel_date)} · {t.kg} kg livres{t.example ? " · exemplo" : ""}</span></div>
                <div><b>{kz(t.per_kg)}</b><span className="sub">por kg</span><Stars avg={t.rating} count={t.rating_count} compact /></div>
                <Link className="btn small" href="/registo?para=pedir">Quero enviar</Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {reqs.length ? (
        <section>
          <div className="sechead"><h2>Pedidos à espera</h2><p className="muted">Encomendas à procura de um viajante.</p></div>
          <div className="rows">
            {reqs.map((r, i) => (
              <div className="r" key={i}>
                <div><b>{r.category}</b><span className="sub">{cityName(r.origin)} → {cityName(r.destination)} · {r.kg} kg{r.example ? " · exemplo" : ""}</span></div>
                <div><b>{kz(r.offer)}</b><span className="sub">oferta{r.deadline ? " · até " + fdate(r.deadline) : ""}</span></div>
                <Link className="btn small" href="/registo?para=viajar">Posso levar</Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section id="seguranca" className="band">
        <div className="sechead">
          <h2>Feito para dar confiança</h2>
          <p className="muted">Levar a encomenda de outra pessoa exige confiança. Por isso não publicamos nada sem passar por uma pessoa da equipa.</p>
        </div>
        <div className="feats">
          <div><span className="stepico"><Icon name="idcard" size={22} /></span><h3>Pessoas identificadas</h3><p className="muted">No cadastro pedimos o BI e o telefone, uma só vez (o passaporte é opcional). Quem viaja junta a foto do bilhete, com as datas, e confirmamos tudo antes de a viagem aparecer.</p></div>
          <div><span className="stepico"><Icon name="lock" size={22} /></span><h3>Contactos privados</h3><p className="muted">O teu telefone só a equipa o vê. No quadro aparece apenas o teu primeiro nome.</p></div>
          <div><span className="stepico"><Icon name="shield" size={22} /></span><h3>Cada entrada analisada</h3><p className="muted">Pedidos e viagens passam por uma pessoa da equipa antes de serem publicados.</p></div>
          <div><span className="stepico"><Icon name="list" size={22} /></span><h3>Regras claras</h3><p className="muted">Há uma lista de itens que nunca transportamos. <Link href="/regras">Ver as regras</Link></p></div>
        </div>
        <p className="hint">O pagamento fica retido na carteira até a entrega ser confirmada com um código, e vês onde está a encomenda quando o entregador a pega.</p>
      </section>

      <TopRated />

      <FaqBlock />

      <section className="cta">
        <h2>Pronto para enviar, ou para viajar?</h2>
        <p className="muted">Cria a tua conta em dois minutos. A equipa trata do resto contigo.</p>
        <div className="row">
          <Link className="btn primary" href="/registo?para=pedir">Quero enviar</Link>
          <Link className="btn" href="/registo?para=viajar">Vou viajar</Link>
        </div>
      </section>
    </>
  );
}
