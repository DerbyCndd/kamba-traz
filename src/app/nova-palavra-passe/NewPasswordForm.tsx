"use client";
import { useActionState } from "react";
import { updatePassword, type AuthState } from "../(auth)/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field } from "@/components/ui";

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, {} as AuthState);
  return (
    <form action={action} noValidate>
      <Field id="password" label="Nova palavra-passe" hint="Pelo menos 8 caracteres.">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Field id="again" label="Repete a palavra-passe">
        <input id="again" name="again" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
      <div className="row"><SubmitButton pending="A guardar…">Guardar</SubmitButton></div>
    </form>
  );
}
