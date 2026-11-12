import Link from "next/link";
import { waLink } from "@/lib/format";
import type { FormState } from "@/lib/types";
import { CopyButton } from "./CopyButton";

export function SubmitResult({ done, whatsapp }: { done: NonNullable<FormState["done"]>; whatsapp: string }) {
  const wa = waLink(whatsapp, done.summary);
  const trip = done.kind === "trip";
  return (
    <div className="panel" role="status">
      <div>
        <span className="label">Recebido</span>
        <h2 style={{ marginTop: 6 }}>{trip ? "A tua viagem está em verificação" : "O teu pedido está em verificação"}</h2>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 6 }}>Referência</div>
        <div className="ref">{done.ref}</div>
      </div>
      <p className="muted">
        {trip
          ? "Antes de publicar a viagem pedimos uma foto do passaporte ou BI e do bilhete de avião. Falamos contigo pelo contacto que indicaste."
          : "A equipa confirma os detalhes do item e publica o pedido no quadro. Falamos contigo pelo contacto que indicaste."}
      </p>
      <textarea readOnly rows={7} aria-label="Resumo" defaultValue={done.summary} style={{ fontFamily: "var(--f-mono)", fontSize: 13 }} />
      <div className="row">
        {wa ? <a className="btn primary" href={wa} target="_blank" rel="noopener">Enviar por WhatsApp</a> : null}
        <CopyButton text={done.summary} label="Copiar resumo" className="btn" />
        <Link className="btn" href="/meus">Ver o estado</Link>
        <Link className="btn" href="/quadro">Ver o quadro</Link>
      </div>
      {wa ? <p className="hint">WhatsApp da equipa: {whatsapp}</p> : null}
    </div>
  );
}
