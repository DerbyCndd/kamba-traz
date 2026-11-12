import Link from "next/link";
import { cityName, fdate, kz, refCode, waLink } from "@/lib/format";
import type { ReqPub, TripPub } from "@/lib/types";
import { ExBadge, StatusPill } from "./ui";

export function TripPass({ t, whatsapp }: { t: TripPub; whatsapp: string }) {
  const wa = waLink(
    whatsapp,
    `Olá! Quero enviar uma encomenda na viagem ${cityName(t.origin)} → ${cityName(t.destination)} de ${fdate(t.travel_date)} (ref. ${refCode(t.id)}).`,
  );
  return (
    <article className="pass">
      <div className="main">
        <div className="route"><span>{t.origin}</span><span className="line" /><span>{t.destination}</span></div>
        <div className="city">{cityName(t.origin)} para {cityName(t.destination)}</div>
        <div className="facts">
          <div><span className="label">Data</span><b>{fdate(t.travel_date)}</b></div>
          <div><span className="label">Livre</span><b>{t.kg}&nbsp;kg</b></div>
          <div><span className="label">Viajante</span><b>{t.name || "—"}</b></div>
        </div>
        <div className="row"><StatusPill status={t.status} /><ExBadge example={t.example} /></div>
      </div>
      <div className="stub">
        <div><span className="label">Por kg</span><div><b className="big">{kz(t.per_kg)}</b></div></div>
        {wa
          ? <a className="btn small primary" href={wa} target="_blank" rel="noopener">Quero enviar</a>
          : <Link className="btn small primary" href="/pedir">Pedir envio</Link>}
      </div>
    </article>
  );
}

export function ReqTag({ r, whatsapp }: { r: ReqPub; whatsapp: string }) {
  const wa = waLink(
    whatsapp,
    `Olá! Vou viajar de ${cityName(r.origin)} para ${cityName(r.destination)} e posso levar este pedido: ${r.item} (ref. ${refCode(r.id)}).`,
  );
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
        <div><span>Pedido por</span>{r.name || "—"}</div>
      </div>
      <div className="row indent"><span className="hint">{r.category}</span><ExBadge example={r.example} /></div>
      {r.status === "aberto" ? (
        <div className="indent">
          {wa
            ? <a className="btn small primary" href={wa} target="_blank" rel="noopener">Posso levar</a>
            : <Link className="btn small" href="/viajar">Publicar a minha viagem</Link>}
        </div>
      ) : null}
    </article>
  );
}
