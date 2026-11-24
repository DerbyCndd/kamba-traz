"use client";
import { useState, useTransition } from "react";
import { startTripDeal } from "@/app/entregas/actions";

/** O entregador já recolheu a encomenda e parte: a entrega passa a «em viagem» e começa a partilha de localização. */
export function StartTrip({ dealId }: { dealId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="panel">
      <h3>Partir em viagem</h3>
      <p className="muted">Recolheste a encomenda. Quando partires, confirma aqui: quem envia passa a ver o percurso no mapa, enquanto a app estiver aberta.</p>
      {error ? <div className="notice bad" role="alert">{error}</div> : null}
      <div className="row">
        <button type="button" className="btn small primary" disabled={pending} onClick={() => start(async () => { const r = await startTripDeal(dealId); if (r.error) setError(r.error); })}>
          {pending ? "A guardar…" : "Estou em viagem"}
        </button>
      </div>
    </div>
  );
}
