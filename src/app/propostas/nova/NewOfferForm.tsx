"use client";
import { useActionState, useState } from "react";
import { makeOffer, type OfferState } from "../actions";
import { Field } from "@/components/ui";
import { kz } from "@/lib/format";

export type Option = { id: string; label: string; suggest: number };

/**
 * Propor um valor. Quem viaja escolhe a viagem (o pedido vem do quadro); quem envia escolhe o pedido (a viagem vem do quadro).
 * O valor sugerido é só um ponto de partida: a oferta do pedido, ou o preço por kg da viagem vezes o peso.
 */
export function NewOfferForm({ mode, targetId, options, commission }: { mode: "traveler" | "requester"; targetId: string; options: Option[]; commission: number }) {
  const [state, action, pending] = useActionState(makeOffer, {} as OfferState);
  const [chosen, setChosen] = useState(options[0]?.id ?? "");
  const [price, setPrice] = useState(String(options[0]?.suggest ?? ""));
  const [touched, setTouched] = useState(false);
  const p = parseFloat(price) || 0;
  const fee = Math.round((p * commission) / 100);

  function pickOption(id: string) {
    setChosen(id);
    const o = options.find((x) => x.id === id);
    if (o && !touched) setPrice(String(o.suggest));
  }

  return (
    <div className="panel">
      <form action={action} noValidate>
        <input type="hidden" name={mode === "traveler" ? "request" : "trip"} value={targetId} />
        <div className="fields">
          <Field id="own" label={mode === "traveler" ? "Com que viagem?" : "Com que pedido?"} full>
            <select id="own" name={mode === "traveler" ? "trip" : "request"} value={chosen} onChange={(e) => pickOption(e.target.value)}>
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field id="price" label="O teu valor (Kz)" hint="Para a entrega toda. A outra parte pode aceitar, recusar ou propor outro valor." error={state.error} full>
            <input id="price" name="price" type="number" min="1" step="500" inputMode="numeric" value={price} onChange={(e) => { setPrice(e.target.value); setTouched(true); }} />
          </Field>
        </div>
        {p ? <p className="hint">Taxa Kamba de {commission}%: {kz(fee)}. O viajante recebe {kz(p - fee)}.</p> : null}
        <div className="row"><button type="submit" className="btn primary" disabled={pending || !chosen}>{pending ? "A enviar…" : "Enviar proposta"}</button></div>
      </form>
    </div>
  );
}
