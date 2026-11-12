"use client";
import { useActionState, useState } from "react";
import { createDeal, type AdminState } from "../actions";
import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { fdate, kz } from "@/lib/format";
import type { WaiverHolder } from "@/lib/types";

type R = { id: string; user_id: string; item: string; origin: string; destination: string; name: string; offer: number };
type T = { id: string; user_id: string; origin: string; destination: string; travel_date: string; name: string };

export function DealForm({ reqs, trips, commission, holders }: { reqs: R[]; trips: T[]; commission: number; holders: WaiverHolder[] }) {
  const [state, action] = useActionState(createDeal, {} as AdminState);
  const [price, setPrice] = useState("");
  const [reqId, setReqId] = useState("");
  const [tripId, setTripId] = useState("");
  // Prémio do mês (só um aviso: a decisão final é da base de dados ao criar a entrega).
  const who = [
    holders.find((h) => h.role === "traveler" && h.user_id === trips.find((t) => t.id === tripId)?.user_id),
    holders.find((h) => h.role === "requester" && h.user_id === reqs.find((r) => r.id === reqId)?.user_id),
  ].find(Boolean);
  const p = parseFloat(price) || 0;
  const c = who ? 0 : Math.round((p * commission) / 100);
  return (
    <div className="panel flat">
      <h3>Ligar pedido a viajante</h3>
      <form action={action}>
        <div className="fields">
          <Field id="d-req" label="Pedido">
            <select id="d-req" name="request" value={reqId} onChange={(e) => { setReqId(e.target.value); const r = reqs.find((x) => x.id === e.target.value); if (r && !price) setPrice(String(r.offer)); }}>
              <option value="">Escolher pedido…</option>
              {reqs.map((r) => <option key={r.id} value={r.id}>{r.item} · {r.origin}→{r.destination} · {r.name}</option>)}
            </select>
          </Field>
          <Field id="d-trip" label="Viagem">
            <select id="d-trip" name="trip" value={tripId} onChange={(e) => setTripId(e.target.value)}>
              <option value="">Escolher viagem…</option>
              {trips.map((t) => <option key={t.id} value={t.id}>{t.origin}→{t.destination} · {fdate(t.travel_date)} · {t.name}</option>)}
            </select>
          </Field>
          <Field id="d-price" label="Valor acordado (Kz)">
            <input id="d-price" name="price" type="number" min="0" step="500" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
        </div>
        {who ? <div className="notice good" role="status">{who.first_name} ganhou o prémio do mês passado ({who.role === "traveler" ? "melhor entregador" : "melhor remetente"}): esta entrega fica <b>sem comissão</b>.</div> : null}
        {p ? <span className="hint">Comissão {who ? "0% (prémio do mês)" : commission + "%"}: {kz(c)} · Viajante recebe {kz(p - c)}</span> : null}
        {state.error ? <span className="err" role="alert">{state.error}</span> : null}
        {state.message ? <span className="hint" role="status">{state.message}</span> : null}
        <div className="row"><SubmitButton className="btn primary small" pending="A criar…">Criar entrega</SubmitButton></div>
      </form>
    </div>
  );
}
