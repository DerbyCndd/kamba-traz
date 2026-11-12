"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, resendConfirmation, type AuthState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field } from "@/components/ui";

const init: AuthState = {};

export function LoginForm() {
  const [state, action] = useActionState(login, init);
  const [resent, resend] = useActionState(resendConfirmation, init);
  return (
    <>
      <form action={action} noValidate>
        <Field id="email" label="Email">
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.email} required />
        </Field>
        <Field id="password" label="Palavra-passe">
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
        <div className="row">
          <SubmitButton pending="A entrar…">Entrar</SubmitButton>
          <Link href="/recuperar" className="hint">Esqueci a palavra-passe</Link>
        </div>
      </form>

      {state.needsConfirm ? (
        <form action={resend}>
          <input type="hidden" name="email" value={state.email ?? ""} />
          <SubmitButton className="btn" pending="A reenviar…">Reenviar email de confirmação</SubmitButton>
          {resent.message ? <div className="notice good" role="status">{resent.message}</div> : null}
          {resent.error ? <div className="notice bad" role="alert">{resent.error}</div> : null}
        </form>
      ) : null}

      <p className="hint">Ainda não tens conta? <Link href="/registo"><b>Criar conta</b></Link></p>
    </>
  );
}
