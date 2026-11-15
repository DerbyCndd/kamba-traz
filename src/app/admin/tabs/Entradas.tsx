import { SubmitButton } from "@/components/SubmitButton";
import { TwoStepButton } from "@/components/TwoStepButton";
import { cityName, fdate, firstName, kz, waLink } from "@/lib/format";
import type { Config, Deal, IdentityView, Req, TravelerDocView, Trip } from "@/lib/types";
import { DocBlock } from "./DocBlock";
import { IdentityBlock } from "./IdentityBlock";
import { InvoiceButton } from "./InvoiceButton";
import { needsInvoice } from "@/lib/customs";
import { approveItem, rejectItem } from "../actions";
import Link from "next/link";

export function Entradas({ trips, reqs, deals, config, docs, idents, otherPending = 0 }: { trips: Trip[]; reqs: Req[]; deals: Deal[]; config: Config; docs: TravelerDocView[]; idents: IdentityView[]; otherPending?: number }) {
  const docOf = new Map(docs.map((d) => [d.trip_id, d]));
  const identOf = new Map(idents.map((i) => [i.user_id, i]));
  const items = [
    ...trips.filter((t) => t.status === "pendente").map((t) => ({ kind: "trip" as const, it: t })),
    ...reqs.filter((r) => r.status === "pendente").map((r) => ({ kind: "request" as const, it: r })),
  ].sort((a, b) => Number(!!(b.it as Req).urgent) - Number(!!(a.it as Req).urgent) || b.it.created_at.localeCompare(a.it.created_at)); // urgentes primeiro

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
        {otherPending ? null : <div className="empty"><h3>Nada por verificar</h3><p>Os pedidos e viagens enviados aparecem aqui com o contacto de quem os fez.</p></div>}
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
              {!isTrip && r.urgent ? <span className="pill bad">URGENTE</span> : <span className="pill warn">NOVO</span>}
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
                  <div><span>Valor do item</span>{r.item_value} €{r.item_currency && r.item_currency !== "EUR" && r.item_amount ? ` (escreveu ${r.item_amount} ${r.item_currency}, convertido)` : ""}</div>
                  <div><span>Oferta</span>{kz(r.offer)}</div>
                </>
              )}
            </div>
            {!isTrip && r.urgent ? (
              <div className="notice bad" role="alert">
                <b>Pedido urgente de conta nova, acima do limite.</b> Justificação: {r.urgent_reason || "(sem texto)"}. Lê, vê os documentos da pessoa e decide: aprovar e publicar, ou recusar.
              </div>
            ) : null}
            {!isTrip && "invoice_path" in r && !r.invoice_path && needsInvoice(r.category, r.item_value) ? <div className="notice bad" role="alert"><b>Falta a fatura.</b> Este pedido é de um bem de risco e não trouxe fatura.</div> : null}
            <IdentityBlock userId={it.user_id} ident={identOf.get(it.user_id)} accountName={it.name} tripReturn={isTrip ? t.return_date : null} />
            {isTrip && identOf.get(it.user_id) && !identOf.get(it.user_id)?.passport_last4 ? (
              <div className="notice bad" role="alert"><b>Sem passaporte registado.</b> Esta pessoa vai viajar mas não registou o passaporte (nem as fotos). Não aprovar antes de o registar.</div>
            ) : null}
            {isTrip ? <DocBlock tripId={it.id} doc={docOf.get(it.id)} accountName={it.name} /> : null}
            <div className="row">
              {isTrip && (docOf.get(it.id)?.status !== "confirmado" || (identOf.get(it.user_id) && identOf.get(it.user_id)?.status !== "confirmado")) ? (
                <span className="hint">Confirma primeiro a identificação e o bilhete para poderes aprovar.</span>
              ) : (
                <form action={approveItem.bind(null, kind, it.id)} className="inline">
                  <SubmitButton className="btn small primary" pending="A publicar…">Aprovar e publicar</SubmitButton>
                </form>
              )}
              {!isTrip && r.invoice_path ? <InvoiceButton requestId={it.id} /> : null}
              {wa ? <a className="btn small" href={wa} target="_blank" rel="noopener">Contactar por WhatsApp</a> : null}
              <TwoStepButton label="Recusar" action={rejectItem.bind(null, kind, it.id)} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
