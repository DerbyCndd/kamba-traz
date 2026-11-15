import Link from "next/link";
import { TripPass } from "@/components/Cards";
import { Calculator } from "@/components/Calculator";
import { Icon } from "@/components/Icons";
import { Landing } from "@/components/Landing";
import { TopRated } from "@/components/TopRated";
import { getProfile } from "@/lib/auth";
import { getConfig, getOpenTrips } from "@/lib/data";
import { firstName } from "@/lib/format";

/** Bom dia, boa tarde ou boa noite, pela hora em Luanda. */
function greeting() {
  const h = Number(new Date().toLocaleString("pt-PT", { hour: "numeric", hour12: false, timeZone: "Africa/Luanda" }));
  return h < 12 ? "Bom dia" : h < 19 ? "Boa tarde" : "Boa noite";
}

export default async function Home() {
  const profile = await getProfile();
  if (!profile) return <Landing />;
  const [config, trips] = await Promise.all([getConfig(), getOpenTrips()]);

  return (
    <>
      <section className="hello">
        <h1>{greeting()}, {firstName(profile.full_name || profile.email)}.</h1>
        <p className="muted">Em que te podemos ajudar hoje?</p>
        <div className="tiles">
          <Link className="tile" href="/pedir"><Icon name="box" size={24} /><b>Preciso de enviar</b><span>Pede o envio de uma encomenda para Angola.</span></Link>
          <Link className="tile" href="/viajar"><Icon name="plane" size={24} /><b>Vou viajar</b><span>Ganha com o espaço livre na tua mala.</span></Link>
        </div>
      </section>

      <section className="appgrid">
        <Calculator perKg={config.per_kg} commission={config.commission} />
        <div className="stack">
          <div className="row between">
            <h2>Próximas viagens</h2>
            {trips.length ? <Link className="link" href="/quadro">Ver o quadro →</Link> : null}
          </div>
          {trips.length ? (
            <div className="list">{trips.slice(0, 3).map((t) => <TripPass key={t.id} t={t} />)}</div>
          ) : (
            <p className="muted">Ainda não há viagens publicadas. Podes ser a primeira pessoa.</p>
          )}
        </div>
      </section>

      <TopRated />
    </>
  );
}
