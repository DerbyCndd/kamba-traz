"use client";
import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import type { IdentityView } from "@/lib/types";
import { idPhotoUrl, revealIdNumber, setIdentityStatus } from "../actions";

const LABEL = { pendente: ["warn", "POR CONFIRMAR"], confirmado: ["ok", "CONFIRMADA"], recusado: ["bad", "RECUSADA"] } as const;

/** Identificação feita no cadastro (BI + telefone; passaporte opcional). Números e fotos só se abrem a pedido, e cada abertura fica registada. */
export function IdentityBlock({ userId, ident }: { userId: string; ident?: IdentityView }) {
  const [bi, setBi] = useState<string | null>(null);
  const [pp, setPp] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ident) {
    return <div className="notice"><b>Sem identificação.</b> Esta pessoa ainda não deixou o BI e o telefone.</div>;
  }
  const [cls, text] = LABEL[ident.status];

  async function number(kind: "bi" | "passport") {
    setBusy(true); setMsg("");
    const r = await revealIdNumber(userId, kind);
    (kind === "bi" ? setBi : setPp)(r.value ?? null);
    if (r.error) setMsg(r.error);
    setBusy(false);
  }
  async function photo(kind: "bi" | "passport") {
    setBusy(true); setMsg("");
    const r = await idPhotoUrl(userId, kind);
    if (r.url) window.open(r.url, "_blank", "noopener"); else setMsg(r.error ?? "Não foi possível abrir a foto.");
    setBusy(false);
  }

  return (
    <div className="docblock">
      <div className="head">
        <h4>Identificação</h4>
        <span className={"pill " + cls}>{text}</span>
      </div>
      <div className="kv">
        <div><span>Nome no BI</span>{ident.full_name}</div>
        <div><span>Telefone</span>{ident.phone}</div>
        <div><span>BI</span>{bi ?? "•••• " + ident.bi_last4}</div>
        <div><span>Passaporte</span>{ident.passport_last4 ? (pp ?? "•••• " + ident.passport_last4) : "Não indicado"}</div>
      </div>
      <div className="row">
        <button type="button" className="btn small" onClick={() => photo("bi")} disabled={busy}>Ver foto do BI</button>
        {bi === null ? <button type="button" className="btn small" onClick={() => number("bi")} disabled={busy}>Ver número do BI</button> : null}
        {ident.passport_last4 ? <button type="button" className="btn small" onClick={() => photo("passport")} disabled={busy}>Ver foto do passaporte</button> : null}
        {ident.passport_last4 && pp === null ? <button type="button" className="btn small" onClick={() => number("passport")} disabled={busy}>Ver passaporte</button> : null}
        {ident.status !== "confirmado" ? (
          <form action={setIdentityStatus.bind(null, userId, "confirmado")} className="inline"><SubmitButton className="btn small primary" pending="A guardar…">Confirmar identificação</SubmitButton></form>
        ) : null}
        {ident.status !== "recusado" ? (
          <form action={setIdentityStatus.bind(null, userId, "recusado")} className="inline"><SubmitButton className="btn small danger" pending="A guardar…">Recusar</SubmitButton></form>
        ) : null}
      </div>
      {msg ? <p className="err" role="alert">{msg}</p> : null}
    </div>
  );
}
