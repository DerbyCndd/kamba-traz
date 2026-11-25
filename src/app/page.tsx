import Link from "next/link";
import { TripPass } from "@/components/Cards";
import { Calculator } from "@/components/Calculator";
import { Landing } from "@/components/Landing";
import { getProfile, requireUser } from "@/lib/auth";
import { buildAgenda } from "@/lib/agenda";
import { Boarding, Tag } from "@/components/HomeAgenda";
import { getConfig, getMyDeals, getOffersWaiting, getOpenTrips, getPendingRatings } from "@/lib/data";
import { firstName, refCode } from "@/lib/format";
import { myVerification } from "@/lib/identity";
import { missingForLevel } from "@/lib/verification";

/** Bom dia, boa tarde ou boa noite, pela hora em Luanda. */
function greeting() {
  const h = Number(new Date().toLocaleString("pt-PT", { hour: "numeric", hour12: false, timeZone: "Africa/Luanda" }));
  return h < 12 ? "Bom dia" : h < 19 ? "Boa tarde" : "Boa noite";
}

export default async function Home() {
  const profile = await getProfile();
  if (!profile) return <Landing />;
  const { user, supabase } = await requireUser();
  const [config, trips, deals, offers, ratings, verif] = await Promise.all([
    getConfig(), getOpenTrips(), getMyDeals(), getOffersWaiting(profile.id), getPendingRatings(), myVerification(supabase, user),
  ]);
  const mine = deals.filter((d) => d.sender_id === profile.id || d.traveler_id === profile.id);
  const agenda = buildAgenda({
    userId: profile.id, deals: mine, offersWaiting: offers, ratings,
    missingLevel1: missingForLevel(verif.input, 1), refOf: (id) => "KT-" + refCode(id),
  });
  const now = agenda.filter((x) => x.tone === "now");
  const wait = agenda.filter((x) => x.tone === "wait");
  const active = mine.filter((d) => !["liberado", "cancelado"].includes(d.status));

  return (
    <>
      <section className="today">
        <p className="muted">{greeting()}, {firstName(profile.full_name || profile.email)}.</p>
        <h1>{now.length ? "O que precisa de ti agora" : "Nada à tua espera"}</h1>
        {now.length ? (
          <ul className="tags" aria-label="Tarefas por fazer">{now.map((it, i) => <Tag key={it.key} it={it} first={i === 0} />)}</ul>
        ) : (
          <p className="today-empty">
            Quando houver uma proposta, uma recolha ou um código para dar, aparece aqui.
            Entretanto, podes <Link href="/pedir">pedir um envio</Link> ou <Link href="/viajar">publicar a tua viagem</Link>.
          </p>
        )}
      </section>

      {active.length ? (
        <section className="stack">
          <h2>A caminho</h2>
          <div className="boardings">{active.map((d) => <Boarding key={d.id} d={d} me={profile.id} />)}</div>
        </section>
      ) : null}

      {wait.length && !active.length ? (
        <section className="stack">
          <h2>A acompanhar</h2>
          <ul className="tags">{wait.map((it) => <Tag key={it.key} it={it} />)}</ul>
        </section>
      ) : null}

      <section className="appgrid">
        <div className="stack">
          <div className="row between">
            <h2>Próximas partidas</h2>
            {trips.length ? <Link className="link" href="/quadro">Ver o quadro</Link> : null}
          </div>
          {trips.length ? (
            <div className="list">{trips.slice(0, 3).map((t) => <TripPass key={t.id} t={t} />)}</div>
          ) : (
            <p className="muted">Ainda não há viagens publicadas. Podes ser a primeira pessoa.</p>
          )}
        </div>
        <Calculator perKg={config.per_kg} commission={config.commission} />
      </section>
    </>
  );
}
