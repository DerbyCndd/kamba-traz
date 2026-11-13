"use client";
import { useState, useTransition } from "react";
import { pickupDeal } from "@/app/entregas/actions";

/** O entregador pega a encomenda. Antes, aceita expressamente partilhar a localização enquanto a levar. */
export function PickupPanel({ dealId }: { dealId: string }) {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function pick() {
    setError("");
    start(async () => {
      const r = await pickupDeal(dealId);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="panel">
      <h3>Pegar a encomenda</h3>
      <p className="muted">O pagamento já está retido na carteira. Quando tiveres a encomenda contigo, confirma aqui.</p>
      <label className="check" htmlFor="loc-ok">
        <input id="loc-ok" type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <span>Aceito partilhar a minha localização com quem enviou e com a equipa enquanto levo a encomenda. Pára quando a entrega for confirmada.</span>
      </label>
      {error ? <div className="notice bad" role="alert">{error}</div> : null}
      <div className="row"><button type="button" className="btn primary" disabled={!ok || pending} onClick={pick}>{pending ? "A confirmar…" : "Peguei a encomenda"}</button></div>
    </div>
  );
}
