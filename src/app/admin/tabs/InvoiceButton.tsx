"use client";
import { useState } from "react";
import { invoiceUrl } from "../actions";

/** Abre a fatura do pedido numa ligação temporária (a fatura é privada). */
export function InvoiceButton({ requestId }: { requestId: string }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true); setMsg("");
    const r = await invoiceUrl(requestId);
    if (r.url) window.open(r.url, "_blank", "noopener"); else setMsg(r.error ?? "Não foi possível abrir a fatura.");
    setBusy(false);
  }
  return (
    <>
      <button type="button" className="btn small" onClick={open} disabled={busy}>Ver fatura</button>
      {msg ? <span className="err" role="alert">{msg}</span> : null}
    </>
  );
}
