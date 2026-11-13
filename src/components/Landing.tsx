import Link from "next/link";
import { Bag } from "@/components/Bag";
import { FaqBlock } from "@/components/FaqBlock";
import { HowItWorks } from "@/components/HowItWorks";
import { Icon } from "@/components/Icons";
import { Stars } from "@/components/Stars";
import { TopRated } from "@/components/TopRated";
import { getPreview } from "@/lib/data";
import { cityName, fdate, kz } from "@/lib/format";

/** Para quem ainda não tem sessão. Pouco texto, uma acção principal. O quadro mostra só rota, peso, data e valor (nunca nomes nem contactos). */
export async function Landing() {
  const { trips, reqs } = await getPreview();
  return (
    <>
      <section className="hero">
        <div className="copy">
          <h1>Encomendas para Angola, na mala de quem já vai.</h1>
          <p className="lead">Ligamos quem envia a quem viaja. A equipa confirma tudo.</p>
          <div className="row">
            <Link className="btn primary" href="/registo?para=pedir">Quero enviar</Link>
            <Link className="link" href="/registo?para=viajar">Vou viajar →</Link>
          </div>
        </div>
        <div className="heroart"><Bag className="bag" /></div>
      </section>

      <section>
        <h2>Como funciona</h2>
        <HowItWorks />
      </section>

      {trips.length ? (
        <section>
          <h2>Próximas viagens</h2>
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
          <h2>Pedidos à espera</h2>
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

      <TopRated />

      <section>
        <div className="facts-row">
          <span><Icon name="shield" size={20} />Viajantes identificados pela equipa</span>
          <span><Icon name="user" size={20} />Contactos só a equipa vê</span>
          <span><Icon name="list" size={20} /><Link href="/regras">O que nunca levamos</Link></span>
        </div>
      </section>

      <FaqBlock />
    </>
  );
}
