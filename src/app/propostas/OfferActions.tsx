"use client";
import { useActionState, useState } from "react";
import { respondOffer, type OfferState } from "./actions";
import { kz } from "@/lib/format";

const DONE: Record<NonNullable<OfferState["done"]>, string> = {
  aceite: "Acordo fechado. A equipa vai falar contigo sobre o pagamento.",
  recusada: "Proposta recusada.",
  contraproposta: "Enviámos o teu valor. Fica à espera da resposta.",
  indisponivel: "Esta proposta já não está disponível: o pedido ou a viagem foram fechados.",
};

/** Responder a uma proposta recebida: aceitar, recusar ou propor outro valor. */
export function OfferActions({ offerId, price }: { offerId: string; price: number }) {
  const [state, action, pending] = useActionState(respondOffer, {} as OfferState);
  const [counter, setCounter] = useState(false);

  if (state.done) return <p className="notice good" role="status">{DONE[state.done]}</p>;
  return (
    <form action={action} className="offeractions" noValidate>
      <input type="hidden" name="offer" value={offerId} />
      {counter ? (
        <div className="field">
          <label htmlFor={"p-" + offerId}>O teu valor (Kz)</label>
          <input id={"p-" + offerId} name="price" type="number" min="1" step="500" inputMode="numeric" defaultValue={price} aria-invalid={state.error ? true : undefined} />
        </div>
      ) : null}
      {state.error ? <p className="err" role="alert">{state.error}</p> : null}
      <div className="row">
        {counter ? (
          <>
            <button type="submit" name="action" value="contrapor" className="btn primary small" disabled={pending}>{pending ? "A enviar…" : "Enviar este valor"}</button>
            <button type="button" className="btn small" onClick={() => setCounter(false)}>Voltar</button>
          </>
        ) : (
          <>
            <button type="submit" name="action" value="aceitar" className="btn primary small" disabled={pending}>{pending ? "A guardar…" : `Aceitar ${kz(price)}`}</button>
            <button type="button" className="btn small" onClick={() => setCounter(true)}>Propor outro valor</button>
            <button type="submit" name="action" value="recusar" className="btn small danger" disabled={pending}>Recusar</button>
          </>
        )}
      </div>
    </form>
  );
}
