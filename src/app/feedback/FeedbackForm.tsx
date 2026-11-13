"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { submitFeedback, type FeedbackState } from "./actions";

const KINDS: [string, string][] = [["elogio", "Elogio"], ["ideia", "Ideia"], ["problema", "Problema"], ["outro", "Outro"]];
const STAR = "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z";

export function FeedbackForm({ defaultEmail, page }: { defaultEmail: string; page: string }) {
  const [state, action] = useActionState(submitFeedback, {} as FeedbackState);
  if (state.done) {
    return (
      <div className="panel" role="status">
        <h3>Obrigado!</h3>
        <p className="muted">Recebemos o seu feedback. A equipa lê tudo e usa-o para melhorar a Kamba Traz.</p>
      </div>
    );
  }
  return (
    <form action={action} noValidate>
      <input type="hidden" name="page" value={page} />
      {/* campo-armadilha: as pessoas não o veem, os robôs preenchem-no */}
      <div className="trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <fieldset className="fs">
        <legend>Que tipo de feedback é?</legend>
        <div className="chips">
          {KINDS.map(([v, name], i) => (
            <span key={v} className="chip">
              <input type="radio" id={"k-" + v} name="kind" value={v} defaultChecked={i === 1} />
              <label htmlFor={"k-" + v}>{name}</label>
            </span>
          ))}
        </div>
      </fieldset>

      <fieldset className="starpick">
        <legend>Como avalia a experiência? (opcional)</legend>
        <div className="starrow">
          {[5, 4, 3, 2, 1].map((n) => (
            <span key={n} className="sp">
              <input type="radio" id={"fr-" + n} name="rating" value={n} />
              <label htmlFor={"fr-" + n}>
                <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
                <span className="sr">{n} {n === 1 ? "estrela" : "estrelas"}</span>
              </label>
            </span>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="message">A sua mensagem</label>
        <textarea id="message" name="message" rows={5} maxLength={1000} required placeholder="O que correu bem? O que podemos melhorar? Algo não funcionou?" aria-invalid={state.error ? true : undefined} />
      </div>
      <div className="field">
        <label htmlFor="email">Email (opcional)</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={120} defaultValue={defaultEmail} />
        <span className="hint">Só se quiser que lhe respondamos. Só a equipa o vê.</span>
      </div>
      {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
      <div className="row"><SubmitButton pending="A enviar…">Enviar feedback</SubmitButton></div>
    </form>
  );
}
