"use client";
import Link from "next/link";
import { useActionState } from "react";
import { submitTrip } from "../actions";
import { FROM, TO } from "@/lib/constants";
import { cityName } from "@/lib/format";
import { emptyForm } from "@/lib/types";
import { Field } from "@/components/ui";
import { useFocusFirstError } from "@/components/useFocusFirstError";
import { SubmitButton } from "@/components/SubmitButton";
import { SubmitResult } from "@/components/SubmitResult";

const cityOpts = (codes: string[]) =>
  codes.map((c) => <option key={c} value={c}>{cityName(c)}{c !== "OTH" ? ` (${c})` : ""}</option>);

export function TripForm({ perKg, whatsapp, defaultName, minDate }: { perKg: number; whatsapp: string; defaultName: string; minDate: string }) {
  const [state, action] = useActionState(submitTrip, emptyForm);
  useFocusFirstError(state.errors);
  if (state.done) return <SubmitResult done={state.done} whatsapp={whatsapp} />;

  const v = state.values, e = state.errors;
  return (
    <div className="panel">
      <form action={action} noValidate>
        <div className="fields">
          <Field id="name" label="O teu nome" hint="No quadro mostramos só o primeiro nome." error={e.name}>
            <input id="name" name="name" autoComplete="name" maxLength={60} defaultValue={v.name ?? defaultName} />
          </Field>
          <Field id="contact" label="WhatsApp ou telefone" hint="Só a equipa vê este número." error={e.contact}>
            <input id="contact" name="contact" type="tel" autoComplete="tel" inputMode="tel" placeholder="+351 9XX XXX XXX" defaultValue={v.contact} />
          </Field>
          <Field id="origin" label="Sais de"><select id="origin" name="origin" defaultValue={v.origin ?? "LIS"}>{cityOpts(FROM)}</select></Field>
          <Field id="destination" label="Chegas a"><select id="destination" name="destination" defaultValue={v.destination ?? "LAD"}>{cityOpts(TO)}</select></Field>
          <Field id="date" label="Data da viagem" error={e.date}><input id="date" name="date" type="date" min={minDate} defaultValue={v.date} /></Field>
          <Field id="flight" label="Companhia e voo (opcional)" error={e.flight}>
            <input id="flight" name="flight" maxLength={30} placeholder="Ex.: TAAG DT 701" defaultValue={v.flight} />
          </Field>
          <Field id="kg" label="Espaço livre na mala (kg)" error={e.kg}>
            <input id="kg" name="kg" type="number" min="1" step="1" inputMode="numeric" defaultValue={v.kg} />
          </Field>
          <Field id="perKg" label="Preço por kg (Kz)" hint="Podes ajustar a cada pedido." error={e.perKg}>
            <input id="perKg" name="perKg" type="number" min="0" step="500" inputMode="numeric" defaultValue={v.perKg ?? perKg} />
          </Field>
        </div>
        <div className="field">
          <label className="check" htmlFor="ok">
            <input id="ok" name="ok" type="checkbox" defaultChecked={v.ok === "on"} aria-invalid={e.ok ? true : undefined} aria-describedby={e.ok ? "ok-e" : undefined} />
            <span>Aceito mostrar passaporte ou BI e bilhete de avião, abrir e fotografar cada volume junto de quem envia, e não levar nada que esteja nas <Link href="/regras">regras de itens proibidos</Link>.</span>
          </label>
          <span className="err" id="ok-e" role="alert">{e.ok || ""}</span>
        </div>
        {state.formError ? <div className="notice bad" role="alert">{state.formError}</div> : null}
        <div className="row"><SubmitButton>Publicar viagem</SubmitButton></div>
      </form>
    </div>
  );
}
