"use client";
import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { fdate } from "@/lib/format";
import type { TravelerDocView } from "@/lib/types";
import { revealPassport, setDocStatus, ticketUrl } from "../actions";

const LABEL = { pendente: ["warn", "POR CONFIRMAR"], confirmado: ["ok", "CONFIRMADOS"], recusado: ["bad", "RECUSADOS"] } as const;

/** Identificação do viajante, para a equipa. O passaporte e a foto só se abrem a pedido, e cada abertura fica registada. */
export function DocBlock({ tripId, doc, accountName }: { tripId: string; doc?: TravelerDocView; accountName: string }) {
  const [passport, setPassport] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  if (!doc) {
    return <div className="notice bad" role="alert"><b>Sem documentos.</b> Esta viagem não pode ser aprovada. Pede ao viajante para a registar de novo, com o passaporte e o bilhete.</div>;
  }
  const [cls, text] = LABEL[doc.status];

  async function showPassport() {
    setBusy(true); setMsg("");
    const r = await revealPassport(tripId);
    setPassport(r.value ?? null); if (r.error) setMsg(r.error);
    setBusy(false);
  }
  async function showTicket() {
    setBusy(true); setMsg("");
    const r = await ticketUrl(tripId);
    if (r.url) window.open(r.url, "_blank", "noopener"); else setMsg(r.error ?? "Não foi possível abrir a foto.");
    setBusy(false);
  }

  return (
    <div className="docblock">
      <div className="head">
        <h4>Documentos do viajante</h4>
        <span className={"pill " + cls}>{text}</span>
      </div>
      <div className="kv">
        <div><span>Nome no passaporte</span>{doc.full_name}</div>
        <div><span>Nome da conta</span>{accountName}</div>
        <div><span>Passaporte</span>{passport ?? "•••• " + doc.passport_last4}</div>
        <div><span>Ida</span>{fdate(doc.outbound_date)}</div>
        <div><span>Regresso</span>{fdate(doc.return_date)}</div>
      </div>
      <p className="hint">Confirma que o nome do passaporte, o do bilhete e o da conta são a mesma pessoa, e que as datas do bilhete batem com as de cima.</p>
      <div className="row">
        <button type="button" className="btn small" onClick={showTicket} disabled={busy}>Ver foto do bilhete</button>
        {passport === null ? <button type="button" className="btn small" onClick={showPassport} disabled={busy}>Ver número do passaporte</button> : null}
        {doc.status !== "confirmado" ? (
          <form action={setDocStatus.bind(null, tripId, "confirmado")} className="inline"><SubmitButton className="btn small primary" pending="A guardar…">Confirmar documentos</SubmitButton></form>
        ) : null}
        {doc.status !== "recusado" ? (
          <form action={setDocStatus.bind(null, tripId, "recusado")} className="inline"><SubmitButton className="btn small danger" pending="A guardar…">Recusar</SubmitButton></form>
        ) : null}
      </div>
      {msg ? <p className="err" role="alert">{msg}</p> : null}
    </div>
  );
}
