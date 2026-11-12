"use client";
import { useActionState } from "react";
import { resendConfirmation, type AuthState } from "../../actions";
import { SubmitButton } from "@/components/SubmitButton";

export function ResendForm({ email }: { email: string }) {
  const [state, action] = useActionState(resendConfirmation, {} as AuthState);
  if (!email) return null;
  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <SubmitButton className="btn" pending="A reenviar…">Reenviar email</SubmitButton>
      {state.message ? <div className="notice good" role="status">{state.message}</div> : null}
      {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
    </form>
  );
}
