"use client";
import { useActionState } from "react";
import { reportDeal } from "@/app/entregas/actions";
import type { DeliveryState } from "@/app/entregas/actions";
import { SubmitButton } from "./SubmitButton";

const KINDS: [string, string][] = [
  ["nao_recebida", "A encomenda não chegou"],
  ["volume_diferente", "O volume ou o conteúdo é diferente do combinado"],
  ["item_proibido", "Há um item proibido ou suspeito"],
  ["conduta", "Comportamento da outra pessoa"],
  ["outro", "Outro problema"],
];

/** Denúncia de um problema numa entrega. Vai só para a equipa; a outra parte não a vê. */
export function ReportForm({ dealId }: { dealId: string }) {
  const [state, action] = useActionState(reportDeal, {} as DeliveryState);
  if (state.done) return <div className="notice good" role="status">Recebemos a tua denúncia. A equipa vai analisá-la e falar contigo. A outra parte não a vê.</div>;
  return (
    <form action={action} className="form" noValidate>
      <input type="hidden" name="deal" value={dealId} />
      <div className="field">
        <label htmlFor={`rk-${dealId}`}>Tipo de problema</label>
        <select id={`rk-${dealId}`} name="kind" defaultValue="" required>
          <option value="" disabled>Escolhe…</option>
          {KINDS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`rm-${dealId}`}>O que aconteceu</label>
        <textarea id={`rm-${dealId}`} name="message" rows={4} minLength={10} maxLength={600} required placeholder="Conta com factos: o que combinaram, o que aconteceu e quando." />
        <span className="hint">Só a equipa lê. Não escrevas palavras-passe nem números de documentos.</span>
      </div>
      {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}
      <div className="row"><SubmitButton pending="A enviar…">Enviar denúncia à equipa</SubmitButton></div>
    </form>
  );
}
