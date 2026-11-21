"use client";
import { useActionState } from "react";
import { saveDropoff, type DropoffState } from "@/app/meus/actions";
import { Field } from "./ui";
import { MapField } from "./MapField";
import { SubmitButton } from "./SubmitButton";

/** Onde o entregador recebe encomendas, para quem envia lhe levar. Só quem envia vê, com o pagamento retido. */
export function DropoffForm({ tripId, initial }: { tripId: string; initial?: { address: string; notes: string; map: string } }) {
  const [state, action] = useActionState(saveDropoff, {} as DropoffState);
  return (
    <form action={action} className="form" noValidate>
      <input type="hidden" name="trip" value={tripId} />
      <p className="hint">Se preferires que quem envia te leve a encomenda, indica onde a recebes. Só quem envia vê isto, depois de o pagamento ficar retido. Em branco, és tu a ir buscar à morada de quem envia, ou combinam pelo telefone.</p>
      <div className="fields">
        <Field id={"da-" + tripId} label="Morada onde recebes" hint="Rua, número, bairro e cidade." full>
          <input id={"da-" + tripId} name="dropoff_address" maxLength={300} autoComplete="street-address" defaultValue={initial?.address ?? ""} />
        </Field>
        <Field id={"dn-" + tripId} label="Horários e referências" full>
          <input id={"dn-" + tripId} name="dropoff_notes" maxLength={300} defaultValue={initial?.notes ?? ""} />
        </Field>
        <MapField id={"dm-" + tripId} name="dropoff_map" label="Localização no mapa" hint="Cola uma ligação do Google Maps, ou usa o botão para usar a tua localização atual." defaultValue={initial?.map ?? ""} />
      </div>
      {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
      {state.done ? <div className="notice good" role="status">Guardado.</div> : null}
      <div className="row"><SubmitButton pending="A guardar…">Guardar</SubmitButton></div>
    </form>
  );
}
