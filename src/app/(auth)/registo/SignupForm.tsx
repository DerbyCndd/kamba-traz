"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field } from "@/components/ui";

export function SignupForm() {
  const [state, action] = useActionState(signup, {} as AuthState);
  return (
    <>
      <form action={action} noValidate>
        <Field id="name" label="Nome completo">
          <input id="name" name="name" autoComplete="name" maxLength={60} required />
        </Field>
        <Field id="email" label="Email">
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.email} required />
        </Field>
        <Field id="password" label="Palavra-passe" hint="Pelo menos 8 caracteres.">
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field id="again" label="Repete a palavra-passe">
          <input id="again" name="again" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
        <div className="row"><SubmitButton pending="A criar…">Criar conta</SubmitButton></div>
      </form>
      <p className="hint">Já tens conta? <Link href="/login"><b>Entrar</b></Link></p>
    </>
  );
}
