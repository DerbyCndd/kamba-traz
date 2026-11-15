"use client";
import { useActionState } from "react";
import { checkOldIdentities, type AdminState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

/** Contas feitas antes da verificação do mesmo número ainda não têm «impressão»: um botão trata de todas de uma vez. */
export function CheckIdentities({ unchecked }: { unchecked: number }) {
  const [state, action] = useActionState(checkOldIdentities, {} as AdminState);
  if (!unchecked && !state.message) return null;
  return (
    <div className="notice">
      <form action={action} className="row">
        <span>
          <b>Verificação do mesmo número de documento.</b>{" "}
          {unchecked ? `${unchecked} identificação(ões) ainda por verificar (contas anteriores a esta verificação).` : null}
        </span>
        {unchecked ? <SubmitButton className="btn small primary" pending="A verificar…">Verificar agora</SubmitButton> : null}
        {state.error ? <span className="err" role="alert">{state.error}</span> : null}
        {state.message ? <span className="hint" role="status">{state.message}</span> : null}
      </form>
    </div>
  );
}
