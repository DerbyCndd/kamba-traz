import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getConfig, getMyOffers } from "@/lib/data";
import { cityName, fdate, kz } from "@/lib/format";
import type { Offer, ReqPub, TripPub } from "@/lib/types";
import { Empty } from "@/components/ui";
import { OfferActions } from "./OfferActions";

export const metadata: Metadata = { title: "Propostas" };

const LABEL: Record<Offer["status"], [string, string]> = {
  aberta: ["warn", "À espera"],
  aceite: ["ok", "Acordo fechado"],
  convertida: ["ok", "Entrega criada"],
  recusada: ["bad", "Recusada"],
  substituida: ["info", "Substituída"],
  fechada: ["info", "Fechada"],
};

function Context({ r, t }: { r?: ReqPub; t?: TripPub }) {
  return (
    <div className="kv indent">
      <div><span>Pedido</span>{r ? <>{r.item || "Encomenda"} · {r.kg}&nbsp;kg</> : "já não disponível"}</div>
      <div><span>Viagem</span>{t ? <>{cityName(t.origin)} → {cityName(t.destination)} · {fdate(t.travel_date)}</> : "já não disponível"}</div>
    </div>
  );
}

/** Negociação do valor: só o valor, sem chat. O pedido e a viagem aparecem só com os dados públicos (primeiro nome, rota, peso). */
export default async function PropostasPage() {
  const { user } = await requireUser();
  const [{ available, offers, requests, trips }, config] = await Promise.all([getMyOffers(), getConfig()]);

  if (!available) {
    return (
      <section>
        <h2>Propostas</h2>
        <Empty title="As propostas ainda não estão ativas" text="Volta daqui a pouco. Entretanto, a equipa combina o valor contigo." />
      </section>
    );
  }

  const incoming = offers.filter((o) => o.to_user === user.id && o.status === "aberta");
  const sent = offers.filter((o) => o.from_user === user.id && o.status === "aberta");
  const agreed = offers.filter((o) => o.status === "aceite" || o.status === "convertida");
  const past = offers.filter((o) => ["recusada", "substituida", "fechada"].includes(o.status));
  const other = (o: Offer) => (o.from_user === user.id ? o.to_name : o.from_name);
  const mineRole = (o: Offer) => (o.from_user === user.id ? o.from_role : o.from_role === "traveler" ? "requester" : "traveler");
  const fee = (p: number) => Math.round((p * config.commission) / 100);

  const card = (o: Offer, body: React.ReactNode) => (
    <article className="item" key={o.id}>
      <div className="head">
        <div>
          <span className="label">{o.from_user === user.id ? "A tua proposta a" : "Proposta de"} {other(o) || "—"} · {mineRole(o) === "traveler" ? "tu levas" : "tu envias"}</span>
          <h3>{kz(o.price)}</h3>
        </div>
        <span className={"pill " + LABEL[o.status][0]}>{LABEL[o.status][1].toUpperCase()}</span>
      </div>
      <Context r={requests[o.request_id]} t={trips[o.trip_id]} />
      <p className="hint indent">O viajante recebe {kz(o.price - fee(o.price))} (taxa Kamba de {config.commission}%).</p>
      {body}
    </article>
  );

  return (
    <section>
      <h2>Propostas</h2>
      <p className="muted">Aqui combinas o valor, sem trocar mensagens: cada parte propõe um valor, e a outra aceita, recusa ou propõe outro. Quando aceitam, a equipa trata do pagamento.</p>

      {!offers.length ? (
        <Empty title="Ainda não tens propostas" text="Escolhe um pedido ou uma viagem no quadro e toca em «Propor valor»." cta="Ver o quadro" href="/quadro" />
      ) : null}

      {incoming.length ? (
        <div className="list">
          <h3>À espera da tua resposta <span className="cnt">{incoming.length}</span></h3>
          {incoming.map((o) => card(o, <div className="indent"><OfferActions offerId={o.id} price={o.price} /></div>))}
        </div>
      ) : null}

      {sent.length ? (
        <div className="list">
          <h3>Enviadas por ti</h3>
          {sent.map((o) => card(o, <p className="hint indent">À espera de que {o.to_name || "a outra parte"} responda.</p>))}
        </div>
      ) : null}

      {agreed.length ? (
        <div className="list">
          <h3>Acordos</h3>
          {agreed.map((o) => card(o, o.status === "convertida"
            ? <div className="indent"><Link className="btn small" href="/entregas">Ver as entregas</Link></div>
            : <p className="hint indent">Acordaram este valor. A equipa vai falar contigo sobre o pagamento.</p>))}
        </div>
      ) : null}

      {past.length ? (
        <details className="past">
          <summary>Propostas anteriores ({past.length})</summary>
          <div className="list">{past.map((o) => card(o, null))}</div>
        </details>
      ) : null}
    </section>
  );
}
