"use client";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { useFocusFirstError } from "@/components/useFocusFirstError";
import { CIVIL } from "@/lib/safety";
import { PhotoPick } from "../IdentityForm";
import { saveSafety, type SafetyState } from "./actions";

const empty: SafetyState = { errors: {}, values: {} };

/**
 * Segurança da conta: morada e familiares (protegem as duas partes de uma entrega) e a selfie a segurar o BI.
 * Só a equipa os vê, em caso de emergência ou de suspeita de fraude. Mostra só o que ainda falta.
 */
export function SafetyForm({ next, needBase, needSelfie, editing = false, initial = {} }: { next: string; needBase: boolean; needSelfie: boolean; editing?: boolean; initial?: Record<string, string> }) {
  const [state, action] = useActionState(saveSafety, empty);
  const [civil, setCivil] = useState(initial.civil ?? "");
  useFocusFirstError(state.errors);
  const v = Object.keys(state.values).length ? state.values : initial, e = state.errors; // depois de um erro, mantém o que a pessoa escreveu
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
        {editing ? <input type="hidden" name="editar" value="1" /> : null}
        {needBase ? (
          <>
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
          </>
        ) : null}

        {needSelfie ? (
          <fieldset className="fs">
            <legend>Selfie a segurar o BI</legend>
            <p className="privacy">Tira uma foto do teu rosto a segurar o BI aberto ao lado da cara, com o nome e a fotografia do documento bem legíveis. A equipa compara o teu rosto com o BI que enviaste. É uma verificação feita por pessoas, não reconhecimento facial automático. A foto fica em espaço privado e só a equipa a vê.</p>
            <div className="fields">
              <PhotoPick id="selfie" tag="selfie" label="Selfie com o BI" hint="Rosto e BI na mesma foto, com boa luz." error={e.selfie} />
            </div>
          </fieldset>
        ) : null}

        {needBase ? (
          <div className="field">
            <label className="check" htmlFor="ok">
              <input id="ok" name="ok" type="checkbox" defaultChecked={v.ok === "on"} aria-invalid={e.ok ? true : undefined} aria-describedby={e.ok ? "ok-e" : undefined} />
              <span>Confirmo que a morada é a minha e que tenho autorização dos familiares indicados para dar os seus contactos à Kamba Traz. Li a <Link href="/privacidade" target="_blank">política de privacidade</Link>.</span>
            </label>
            <span className="err" id="ok-e" role="alert">{e.ok || ""}</span>
          </div>
        ) : null}
        {state.formError ? <div className="notice bad" role="alert">{state.formError}</div> : null}
        <div className="row"><SubmitButton pending="A guardar…">Guardar e continuar</SubmitButton></div>
      </form>
    </div>
  );
}
