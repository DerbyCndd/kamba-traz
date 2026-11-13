"use client";
import { useActionState } from "react";
import { confirmDelivery, type DeliveryState } from "@/app/entregas/actions";
import { SubmitButton } from "./SubmitButton";

/** O entregador introduz o código de 6 dígitos que quem recebe lhe dá. */
export function ConfirmDelivery({ dealId }: { dealId: string }) {
  const [state, action] = useActionState(confirmDelivery, {} as DeliveryState);
  if (state.done) return <div className="notice good" role="status">Entrega confirmada. A equipa vai pagar-te o valor que estava retido.</div>;
  return (
    <form action={action} className="panel confirm" noValidate>
      <h3>Confirmar a entrega</h3>
      <p className="muted">Quando entregares, pede a quem recebe o código de 6 dígitos e escreve-o aqui.</p>
      <input type="hidden" name="deal" value={dealId} />
      <div className="field">
        <label htmlFor="code">Código de entrega</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="codeinput" aria-invalid={state.error ? true : undefined} />
      </div>
      {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
      <div className="row"><SubmitButton pending="A confirmar…">Confirmar entrega</SubmitButton></div>
    </form>
  );
}
