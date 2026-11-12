"use client";
import Link from "next/link";
import { useActionState } from "react";
import { requestReset, type AuthState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field } from "@/components/ui";

export function RecoverForm() {
  const [state, action] = useActionState(requestReset, {} as AuthState);
  return (
    <form action={action} noValidate>
      <Field id="email" label="Email">
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.email} required />
      </Field>
      {state.message ? <div className="notice good" role="status">{state.message}</div> : null}
      {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
      <div className="row">
        <SubmitButton pending="A enviar…">Enviar link</SubmitButton>
        <Link href="/login" className="hint">Voltar à entrada</Link>
      </div>
    </form>
  );
}
