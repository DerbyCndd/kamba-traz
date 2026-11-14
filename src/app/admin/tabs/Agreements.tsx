"use client";
import { useActionState } from "react";
import { createDeal, type AdminState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { cityName, fdate, kz } from "@/lib/format";
import type { Offer } from "@/lib/types";

type R = { id: string; item: string; origin: string; destination: string; name: string };
type T = { id: string; origin: string; destination: string; travel_date: string; name: string };

function Row({ o, r, t }: { o: Offer; r?: R; t?: T }) {
  const [state, action] = useActionState(createDeal, {} as AdminState);
  const who = o.from_role === "traveler" ? o.from_name : o.to_name; // quem viaja
  const req = o.from_role === "traveler" ? o.to_name : o.from_name; // quem envia
  return (
    <article className="item">
      <div className="head">
        <div><span className="label">{who} leva o pedido de {req}</span><h3>{kz(o.price)}</h3></div>
        <span className="pill ok">ACORDO FECHADO</span>
      </div>
      <div className="kv">
        <div><span>Pedido</span>{r ? r.item : "já não está aberto"}</div>
        <div><span>Viagem</span>{t ? `${cityName(t.origin)} → ${cityName(t.destination)} · ${fdate(t.travel_date)}` : "já não está aberta"}</div>
      </div>
      {r && t ? (
        <form action={action} className="row">
          <input type="hidden" name="request" value={o.request_id} />
          <input type="hidden" name="trip" value={o.trip_id} />
          <input type="hidden" name="price" value={o.price} />
          <SubmitButton className="btn small primary" pending="A criar…">Criar entrega com este valor</SubmitButton>
          {state.error ? <span className="err" role="alert">{state.error}</span> : null}
          {state.message ? <span className="hint" role="status">{state.message}</span> : null}
        </form>
      ) : <p className="hint">Este acordo já não pode virar entrega (o pedido ou a viagem mudaram de estado).</p>}
    </article>
  );
}

/** Propostas aceites pelas duas partes: a equipa só cria a entrega (as verificações de alfândega, identificação e prémio do mês correm aí). */
export function Agreements({ offers, reqs, trips }: { offers: Offer[]; reqs: R[]; trips: T[] }) {
  if (!offers.length) return null;
  return (
    <div className="panel flat">
      <h3>Acordos por confirmar <span className="cnt">{offers.length}</span></h3>
      <p className="hint">As duas partes já aceitaram o valor. Cria a entrega e depois confirma o pagamento.</p>
      <div className="list">{offers.map((o) => <Row key={o.id} o={o} r={reqs.find((x) => x.id === o.request_id)} t={trips.find((x) => x.id === o.trip_id)} />)}</div>
    </div>
  );
}
