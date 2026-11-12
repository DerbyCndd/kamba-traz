"use client";
import { useActionState } from "react";
import { rateDeal } from "@/app/actions";
import type { PendingRating, RateState } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

const STAR = "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z";
const NAMES = ["", "Mau", "Fraco", "Razoável", "Bom", "Excelente"];

/** Formulário de avaliação de uma entrega: 1 a 5 estrelas e um comentário opcional. */
export function RateForm({ p }: { p: PendingRating }) {
  const [state, action] = useActionState(rateDeal, {} as RateState);
  const who = p.ratee_role === "traveler" ? "o entregador" : "o remetente";

  if (state.done) return <div className="notice good" role="status">Obrigado! A tua avaliação de {p.counterpart} ficou registada.</div>;

  return (
    <form action={action} className="rateform" noValidate>
      <input type="hidden" name="deal" value={p.deal_id} />
      <fieldset className="starpick">
        <legend>Como correu com {p.counterpart}, {who}?</legend>
        <div className="starrow">
          {[5, 4, 3, 2, 1].map((n) => (
            <span key={n} className="sp">
              <input type="radio" id={`s-${p.deal_id}-${n}`} name="stars" value={n} required />
              <label htmlFor={`s-${p.deal_id}-${n}`} title={NAMES[n]}>
                <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
                <span className="sr">{n} {n === 1 ? "estrela" : "estrelas"}, {NAMES[n]}</span>
              </label>
            </span>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor={`c-${p.deal_id}`}>Comentário (opcional)</label>
        <textarea id={`c-${p.deal_id}`} name="comment" maxLength={280} rows={2} placeholder="Foi pontual? Cuidou bem da encomenda?" />
        <span className="hint">Só tu e a equipa vêem o comentário. A média aparece para todos.</span>
      </div>
      {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
      <div className="row"><SubmitButton pending="A guardar…">Enviar avaliação</SubmitButton></div>
    </form>
  );
}
