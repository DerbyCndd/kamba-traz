import Link from "next/link";
import { TripPass } from "@/components/Cards";
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
        <div className="row">
          <Link className="btn primary" href="/pedir">Quero enviar</Link>
          <Link className="btn" href="/viajar">Vou viajar</Link>
        </div>
      </section>

      <section>
        <div className="row between">
          <h2>Próximas viagens</h2>
          {trips.length ? <Link className="link" href="/quadro">Ver o quadro →</Link> : null}
        </div>
        {trips.length ? (
          <div className="grid">{trips.slice(0, 4).map((t) => <TripPass key={t.id} t={t} whatsapp={config.whatsapp} />)}</div>
        ) : (
          <p className="muted">Ainda não há viagens publicadas. Podes ser a primeira pessoa.</p>
        )}
      </section>

      <TopRated />
    </>
  );
}
