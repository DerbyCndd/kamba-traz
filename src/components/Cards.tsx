import Link from "next/link";
import { cityName, fdate, kz } from "@/lib/format";
import type { ReqPub, TripPub } from "@/lib/types";
import { Stars } from "./Stars";
import { ExBadge, StatusPill } from "./ui";

export function TripPass({ t }: { t: TripPub }) {
  return (
    <article className="pass">
      <div className="main">
        <div className="route"><span>{t.origin}</span><span className="line" /><span>{t.destination}</span></div>
        <div className="city">{cityName(t.origin)} para {cityName(t.destination)}</div>
        <div className="facts">
          <div><span className="label">Data</span><b>{fdate(t.travel_date)}</b></div>
          <div><span className="label">Livre</span><b>{t.kg}&nbsp;kg</b></div>
          <div><span className="label">Entregador</span><b>{t.name || "—"}</b><Stars avg={t.rating} count={t.rating_count} compact /></div>
        </div>
        <div className="row"><StatusPill status={t.status} /><ExBadge example={t.example} /></div>
      </div>
      <div className="stub">
        <div><span className="label">Por kg</span><div><b className="big">{kz(t.per_kg)}</b></div></div>
        {t.status === "aberto"
          ? <Link className="btn small primary" href={`/propostas/nova?viagem=${t.id}`}>Propor valor</Link>
          : <Link className="btn small" href="/pedir">Pedir envio</Link>}
      </div>
    </article>
  );
}

export function ReqTag({ r }: { r: ReqPub }) {
  return (
    <article className="bagtag">
      <div className="head">
        <div><span className="label">{r.origin} → {r.destination}</span><h3>{r.item || "Encomenda"}</h3></div>
        <StatusPill status={r.status} />
      </div>
      <div className="kv indent">
        <div><span>Peso</span>{r.kg}&nbsp;kg</div>
        <div><span>Oferta</span>{kz(r.offer)}</div>
        {r.deadline ? <div><span>Até</span>{fdate(r.deadline)}</div> : null}
        <div><span>Pedido por</span>{r.name || "—"}<br /><Stars avg={r.rating} count={r.rating_count} compact /></div>
      </div>
      <div className="row indent"><span className="hint">{r.category}</span><ExBadge example={r.example} /></div>
      {r.status === "aberto" ? (
        <div className="indent">
          <Link className="btn small primary" href={`/propostas/nova?pedido=${r.id}`}>Propor valor</Link>
        </div>
      ) : null}
    </article>
  );
}
