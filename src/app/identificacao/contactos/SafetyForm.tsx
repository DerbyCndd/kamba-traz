"use client";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { useFocusFirstError } from "@/components/useFocusFirstError";
import { CIVIL } from "@/lib/safety";
import { saveSafety, type SafetyState } from "./actions";

const empty: SafetyState = { errors: {}, values: {} };

/** Morada e familiares: protegem as duas partes de uma entrega. Só a equipa os vê, em caso de emergência ou de suspeita de fraude. */
export function SafetyForm({ next }: { next: string }) {
  const [state, action] = useActionState(saveSafety, empty);
  const [civil, setCivil] = useState("");
  useFocusFirstError(state.errors);
  const v = state.values, e = state.errors;
  const married = (civil || v.civil) === "casado";

  function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    startTransition(() => action(fd));
  }

  const relative = (key: string, label: string, required = false) => (
    <>
      <Field id={key + "_name"} label={`${label}: nome${required ? "" : " (opcional)"}`} error={e[key + "_name"]}>
        <input id={key + "_name"} name={key + "_name"} maxLength={80} autoComplete="off" defaultValue={v[key + "_name"]} />
      </Field>
      <Field id={key + "_phone"} label={`${label}: telefone${required ? "" : " (opcional)"}`} error={e[key + "_phone"]}>
        <input id={key + "_phone"} name={key + "_phone"} type="tel" inputMode="tel" autoComplete="off" placeholder="+244 9XX XXX XXX" defaultValue={v[key + "_phone"]} />
      </Field>
    </>
  );

  return (
    <div className="panel">
      <form onSubmit={onSubmit} noValidate>
        <input type="hidden" name="next" value={next} />
        <fieldset className="fs">
          <legend>Onde moras</legend>
          <div className="fields">
            <Field id="address" label="Morada completa" hint="Rua, número, bairro, cidade e país. Só a equipa a vê." error={e.address} full>
              <input id="address" name="address" maxLength={300} autoComplete="street-address" defaultValue={v.address} />
            </Field>
            <Field id="civil" label="Estado civil" error={e.civil}>
              <select id="civil" name="civil" defaultValue={v.civil ?? ""} onChange={(ev) => setCivil(ev.target.value)}>
                <option value="" disabled>Escolhe…</option>
                {CIVIL.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset className="fs">
          <legend>Familiares que podemos contactar</legend>
          <p className="privacy">Indica pelo menos um: a mãe, o pai ou, se não és solteiro(a), o cônjuge. Só a equipa os vê, e só os contacta em caso de emergência ou se suspeitarmos de fraude. Nunca aparecem a outros utilizadores.</p>
          <div className="fields">
            {relative("mae", "Mãe")}
            {relative("pai", "Pai")}
            {married ? relative("conjuge", "Cônjuge", true) : null}
          </div>
        </fieldset>

        <div className="field">
          <label className="check" htmlFor="ok">
            <input id="ok" name="ok" type="checkbox" defaultChecked={v.ok === "on"} aria-invalid={e.ok ? true : undefined} aria-describedby={e.ok ? "ok-e" : undefined} />
            <span>Confirmo que a morada é a minha e que tenho autorização dos familiares indicados para dar os seus contactos à Kamba Traz. Li a <Link href="/privacidade" target="_blank">política de privacidade</Link>.</span>
          </label>
          <span className="err" id="ok-e" role="alert">{e.ok || ""}</span>
        </div>
        {state.formError ? <div className="notice bad" role="alert">{state.formError}</div> : null}
        <div className="row"><SubmitButton pending="A guardar…">Guardar e continuar</SubmitButton></div>
      </form>
    </div>
  );
}
