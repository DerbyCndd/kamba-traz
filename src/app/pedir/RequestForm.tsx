"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { submitRequest } from "../actions";
import { CATS, FROM, TO } from "@/lib/constants";
import { cityName, kz } from "@/lib/format";
import { emptyForm } from "@/lib/types";
import { Field } from "@/components/ui";
import { useFocusFirstError } from "@/components/useFocusFirstError";
import { SubmitButton } from "@/components/SubmitButton";
import { SubmitResult } from "@/components/SubmitResult";

const cityOpts = (codes: string[]) =>
  codes.map((c) => <option key={c} value={c}>{cityName(c)}{c !== "OTH" ? ` (${c})` : ""}</option>);

export function RequestForm({ perKg, whatsapp, defaultName, minDate }: { perKg: number; whatsapp: string; defaultName: string; minDate: string }) {
  const [state, action] = useActionState(submitRequest, emptyForm);
  const [kg, setKg] = useState("");
  useFocusFirstError(state.errors);
  if (state.done) return <SubmitResult done={state.done} whatsapp={whatsapp} />;

  const v = state.values, e = state.errors;
  const k = parseFloat(kg);
  return (
    <div className="panel">
      <form action={action} noValidate>
        <fieldset className="fs">
          <legend>Percurso</legend>
          <div className="fields">
            <Field id="origin" label="Sai de" hint="Não está a tua cidade? Escolhe «Outra cidade»: a equipa pergunta-te qual é."><select id="origin" name="origin" defaultValue={v.origin ?? "LIS"}>{cityOpts(FROM)}</select></Field>
            <Field id="destination" label="Chega a" hint="Entregamos em Angola. Não está a tua cidade? Escolhe «Outra cidade»."><select id="destination" name="destination" defaultValue={v.destination ?? "LAD"}>{cityOpts(TO)}</select></Field>
          </div>
        </fieldset>
        <fieldset className="fs">
          <legend>A encomenda</legend>
          <div className="fields">
            <Field id="item" label="O que queres enviar" full error={e.item}>
            <input id="item" name="item" maxLength={90} placeholder="Ex.: telemóvel novo na caixa" defaultValue={v.item} />
          </Field>
            <Field id="category" label="Tipo de item" full>
            <select id="category" name="category" defaultValue={v.category ?? CATS[0]}>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </Field>
            <Field id="kg" label="Peso aproximado (kg)" error={e.kg}>
            <input id="kg" name="kg" type="number" min="0.1" step="0.1" inputMode="decimal" defaultValue={v.kg} onChange={(ev) => setKg(ev.target.value)} />
          </Field>
            <Field id="value" label="Valor do item (€)" hint="Serve para o seguro e a alfândega." error={e.value}>
            <input id="value" name="value" type="number" min="0" step="1" inputMode="decimal" defaultValue={v.value} />
          </Field>
          </div>
        </fieldset>
        <fieldset className="fs">
          <legend>Pagamento e prazo</legend>
          <div className="fields">
            <Field id="offer" label="Quanto ofereces pelo transporte (Kz)" error={e.offer}>
            <input id="offer" name="offer" type="number" min="0" step="500" inputMode="numeric" defaultValue={v.offer} />
          </Field>
            <Field id="deadline" label="Preciso até (opcional)" error={e.deadline}>
            <input id="deadline" name="deadline" type="date" min={minDate} defaultValue={v.deadline} />
          </Field>
          </div>
        </fieldset>
        <fieldset className="fs">
          <legend>Os teus dados</legend>
          <div className="fields">
            <Field id="name" label="O teu nome" error={e.name}><input id="name" name="name" autoComplete="name" maxLength={60} defaultValue={v.name ?? defaultName} /></Field>
            <Field id="contact" label="WhatsApp ou telefone" hint="Só a equipa vê este número." error={e.contact}>
            <input id="contact" name="contact" type="tel" autoComplete="tel" inputMode="tel" placeholder="+244 9XX XXX XXX" defaultValue={v.contact} />
          </Field>
          </div>
        </fieldset>
        {k > 0 ? <span className="hint">Referência: cerca de {kz(k * perKg)} para {k} kg.</span> : null}
        <div className="field">
          <label className="check" htmlFor="ok">
            <input id="ok" name="ok" type="checkbox" defaultChecked={v.ok === "on"} aria-invalid={e.ok ? true : undefined} aria-describedby={e.ok ? "ok-e" : undefined} />
            <span>Confirmo que o item é legal, que posso mostrá-lo ao viajante para inspecção e que li as <Link href="/regras">regras de itens proibidos</Link>.</span>
          </label>
          <span className="err" id="ok-e" role="alert">{e.ok || ""}</span>
        </div>
        {state.formError ? <div className="notice bad" role="alert">{state.formError}</div> : null}
        <div className="row"><SubmitButton>Enviar pedido</SubmitButton></div>
      </form>
    </div>
  );
}
