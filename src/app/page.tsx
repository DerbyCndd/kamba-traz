import Link from "next/link";
import { TripPass } from "@/components/Cards";
import { Calculator } from "@/components/Calculator";
import { HowItWorks } from "@/components/HowItWorks";
import { Landing } from "@/components/Landing";
import { TopRated } from "@/components/TopRated";
import { Empty, Faq } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { getConfig, getOpenRequests, getOpenTrips } from "@/lib/data";
import { FAQ } from "@/lib/faq";
import { Icon } from "@/components/Icons";
import { firstName, kz } from "@/lib/format";

export default async function Home() {
  const profile = await getProfile();
  if (!profile) return <Landing />;
  const [config, trips, reqs] = await Promise.all([getConfig(), getOpenTrips(), getOpenRequests()]);
  const first = trips[0];

  return (
    <>
      <section className="hero">
        <div className="copy">
          <h1>Olá, {firstName(profile.full_name || profile.email)}.</h1>
          <p className="lead">O que queres fazer hoje?</p>
          <div className="tiles">
            <Link className="tile red" href="/pedir"><Icon name="box" size={26} /><b>Preciso de enviar</b><span>Pede o envio de uma encomenda para Angola.</span></Link>
            <Link className="tile blue" href="/viajar"><Icon name="plane" size={26} /><b>Vou viajar</b><span>Rentabiliza o espaço livre na tua mala.</span></Link>
          </div>
          <div className="counts">
            <div><b>{trips.length}</b><span className="label">viagens abertas</span></div>
            <div><b>{reqs.length}</b><span className="label">pedidos à espera</span></div>
          </div>
        </div>
        <div>
          {first ? <TripPass t={first} whatsapp={config.whatsapp} /> : (
            <article className="pass" aria-label="Exemplo de viagem">
              <div className="main">
                <div className="route"><span>LIS</span><span className="line" /><span>LAD</span></div>
                <div className="city">Lisboa para Luanda</div>
                <div className="facts">
                  <div><span className="label">Data</span><b>a definir</b></div>
                  <div><span className="label">Livre</span><b>10 kg</b></div>
                </div>
                <div className="row"><span className="pill ex">EXEMPLO</span></div>
              </div>
              <div className="stub">
                <div><span className="label">Por kg</span><div><b className="big">{kz(config.per_kg)}</b></div></div>
                <Link className="btn small primary" href="/viajar">Publicar viagem</Link>
              </div>
            </article>
          )}
        </div>
      </section>

      <TopRated />

      <section>
        <h2>Como funciona</h2>
        <HowItWorks />
      </section>

      <section>
        <h2>Quanto custa enviar</h2>
        <div className="panel">
          <Calculator perKg={config.per_kg} commission={config.commission} />
          <p className="hint">Referência de {kz(config.per_kg)} por kg. O valor final é combinado entre as duas partes e pode variar com a época do ano e o tipo de item.</p>
        </div>
      </section>

      <section>
        <h2>Próximas viagens</h2>
        {trips.length ? (
          <>
            <div className="grid">{trips.slice(0, 4).map((t) => <TripPass key={t.id} t={t} whatsapp={config.whatsapp} />)}</div>
            <Link className="btn" href="/quadro" style={{ alignSelf: "flex-start" }}>Ver o quadro completo</Link>
          </>
        ) : (
          <Empty title="Ainda não há viagens publicadas" text="Se vais viajar para Angola, publica a tua viagem e começa a receber pedidos." cta="Publicar viagem" href="/viajar" />
        )}
      </section>

      <section>
        <h2>Perguntas frequentes</h2>
        <Faq items={FAQ} />
      </section>
    </>
  );
}
