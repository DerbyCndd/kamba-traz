"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { fundDeal, type AdminState } from "../actions";

/** A equipa regista que recebeu o pagamento. O valor fica retido na carteira até a entrega ser confirmada. */
export function ConfirmPayment({ dealId }: { dealId: string }) {
  const [state, action] = useActionState(fundDeal.bind(null, dealId), {} as AdminState);
  return (
    <form action={action} className="payform">
      <div className="fields">
        <div className="field">
          <label htmlFor={"m-" + dealId}>Como foi pago</label>
          <select id={"m-" + dealId} name="method" defaultValue="">
            <option value="" disabled>Escolher…</option>
            <option>Transferência bancária</option><option>Multicaixa Express</option><option>Numerário</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={"r-" + dealId}>Referência (opcional)</label>
          <input id={"r-" + dealId} name="reference" maxLength={120} placeholder="Ex.: número da transferência" />
        </div>
      </div>
      {state.error ? <span className="err" role="alert">{state.error}</span> : null}
      {state.message ? <span className="hint" role="status">{state.message}</span> : null}
      <div className="row"><SubmitButton className="btn small primary" pending="A confirmar…">Confirmar pagamento recebido</SubmitButton></div>
    </form>
  );
}
