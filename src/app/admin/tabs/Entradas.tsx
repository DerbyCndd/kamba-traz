import { SubmitButton } from "@/components/SubmitButton";
import { TwoStepButton } from "@/components/TwoStepButton";
import { cityName, fdate, firstName, kz, waLink } from "@/lib/format";
import type { Config, Deal, Req, TravelerDocView, Trip } from "@/lib/types";
import { DocBlock } from "./DocBlock";
import { approveItem, rejectItem } from "../actions";
import Link from "next/link";

export function Entradas({ trips, reqs, deals, config, docs }: { trips: Trip[]; reqs: Req[]; deals: Deal[]; config: Config; docs: TravelerDocView[] }) {
  const docOf = new Map(docs.map((d) => [d.trip_id, d]));
  const items = [
    ...trips.filter((t) => t.status === "pendente").map((t) => ({ kind: "trip" as const, it: t })),
    ...reqs.filter((r) => r.status === "pendente").map((r) => ({ kind: "request" as const, it: r })),
  ].sort((a, b) => b.it.created_at.localeCompare(a.it.created_at));

  const steps: [boolean, string, string][] = [
    [!!config.whatsapp, "Definir o WhatsApp da equipa", "definicoes"],
    [trips.length + reqs.length > 0, "Ter a primeira viagem ou pedido no quadro (ou carregar exemplos)", "quadro"],
    [deals.length > 0, "Criar a primeira entrega", "ligacoes"],
  ];

  if (!items.length) {
    return (
      <div className="list">
        <div className="panel">
          <h3>Primeiros passos</h3>
          <div className="list">
            {steps.map(([ok, text, tab]) => (
              <div className="row" key={text}>
                <span className={"pill " + (ok ? "ok" : "warn")}>{ok ? "FEITO" : "POR FAZER"}</span>
                <span>{text}</span>
                {ok ? null : <Link className="btn small" href={`/admin?tab=${tab}`}>Ir</Link>}
              </div>
            ))}
          </div>
        </div>
        <div className="empty"><h3>Nada por verificar</h3><p>Os pedidos e viagens enviados aparecem aqui com o contacto de quem os fez.</p></div>
      </div>
    );
  }

  return (
    <div className="list">
      {items.map(({ kind, it }) => {
        const isTrip = kind === "trip";
        const t = it as Trip, r = it as Req;
        const wa = waLink(it.contact, `Olá ${firstName(it.name)}, daqui a equipa da Kamba Traz. Recebemos o seu ${isTrip ? "registo de viagem" : "pedido"} e precisamos de confirmar alguns dados.`);
        return (
          <article className="item" key={it.id}>
            <div className="head">
              <div>
                <span className="label">{isTrip ? "Viagem" : "Pedido de envio"}</span>
                <h3>{isTrip ? `${cityName(t.origin)} → ${cityName(t.destination)} · ${fdate(t.travel_date)}` : r.item}</h3>
              </div>
              <span className="pill warn">NOVO</span>
            </div>
            <div className="kv">
              <div><span>Nome</span>{it.name}</div>
              <div><span>Contacto</span>{it.contact}</div>
              {isTrip ? (
                <>
                  <div><span>Espaço livre</span>{t.kg} kg</div>
                  <div><span>Preço por kg</span>{kz(t.per_kg)}</div>
                  {t.flight ? <div><span>Voo</span>{t.flight}</div> : null}
                  {t.return_date ? <div><span>Regresso</span>{fdate(t.return_date)}</div> : null}
                </>
              ) : (
                <>
                  <div><span>Rota</span>{cityName(r.origin)} → {cityName(r.destination)}</div>
                  <div><span>Tipo</span>{r.category}</div>
                  <div><span>Peso</span>{r.kg} kg</div>
                  <div><span>Valor do item</span>{r.item_value} €</div>
                  <div><span>Oferta</span>{kz(r.offer)}</div>
                </>
              )}
            </div>
            {isTrip ? <DocBlock tripId={it.id} doc={docOf.get(it.id)} accountName={it.name} /> : null}
            <div className="row">
              {isTrip && docOf.get(it.id)?.status !== "confirmado" ? (
                <span className="hint">Confirma primeiro os documentos para poderes aprovar.</span>
              ) : (
                <form action={approveItem.bind(null, kind, it.id)} className="inline">
                  <SubmitButton className="btn small primary" pending="A publicar…">Aprovar e publicar</SubmitButton>
                </form>
              )}
              {wa ? <a className="btn small" href={wa} target="_blank" rel="noopener">Contactar por WhatsApp</a> : null}
              <TwoStepButton label="Recusar" action={rejectItem.bind(null, kind, it.id)} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
