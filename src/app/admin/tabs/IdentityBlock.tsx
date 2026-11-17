"use client";
import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { identityAlerts } from "@/lib/docchecks";
import { fdate, today } from "@/lib/format";
import type { IdentityView } from "@/lib/types";
import { idPhotoUrl, revealIdNumber, revealSafety, setIdentityStatus } from "../actions";
import { CIVIL, REL_LABEL, type FamilyRel } from "@/lib/safety";

const LABEL = { pendente: ["warn", "POR CONFIRMAR"], confirmado: ["ok", "CONFIRMADA"], recusado: ["bad", "RECUSADA"] } as const;

/** Identificação feita no cadastro (BI + telefone; passaporte opcional). Números e fotos só se abrem a pedido, e cada abertura fica registada. */
export function IdentityBlock({ userId, ident, accountName, tripReturn }: { userId: string; ident?: IdentityView; accountName?: string; tripReturn?: string | null }) {
  const [bi, setBi] = useState<string | null>(null);
  const [pp, setPp] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [safety, setSafety] = useState<{ address?: string; civil?: string; family?: { rel: string; name: string; phone: string }[] } | null>(null);

  if (!ident) {
    return <div className="notice"><b>Sem identificação.</b> Esta pessoa ainda não deixou o BI e o telefone.</div>;
  }
  const [cls, text] = LABEL[ident.status];
  const alerts = identityAlerts({ biExpiry: ident.bi_expiry, passportExpiry: ident.passport_expiry, tripReturn, today: today(), accountName, fullName: ident.full_name });

  async function number(kind: "bi" | "passport") {
    setBusy(true); setMsg("");
    const r = await revealIdNumber(userId, kind);
    (kind === "bi" ? setBi : setPp)(r.value ?? null);
    if (r.error) setMsg(r.error);
    setBusy(false);
  }
  async function showSafety() {
    setBusy(true); setMsg("");
    const r = await revealSafety(userId);
    if (r.error) setMsg(r.error); else setSafety(r);
    setBusy(false);
  }
  async function photo(kind: "bi" | "bi_back" | "passport" | "passport_last") {
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
        {ident.bi_expiry ? <div><span>Validade do BI</span>{fdate(ident.bi_expiry)}</div> : null}
        {ident.passport_expiry ? <div><span>Validade do passaporte</span>{fdate(ident.passport_expiry)}</div> : null}
      </div>
      {ident.dups?.length ? (
        <div className="notice bad" role="alert">
          <b>Mesmo número noutra conta:</b>{" "}
          {ident.dups.map((d) => `${d.kind === "bi" ? "BI" : "passaporte"} igual ao de ${d.name}`).join("; ")}.
          Pode ser engano ao escrever ou o documento de outra pessoa. Compara as fotos e o nome antes de confirmar.
        </div>
      ) : null}
      {alerts.length ? (
        <div className="notice bad" role="alert"><b>Atenção:</b> {alerts.join(" ")}</div>
      ) : ident.bi_expiry ? <p className="hint">Validades em ordem.</p> : <p className="hint">Sem datas de validade (conta anterior às validades). Confere nas fotos.</p>}
      <div className="row">
        <button type="button" className="btn small" onClick={() => photo("bi")} disabled={busy}>Ver BI: frente</button>
        {ident.has_bi_back ? <button type="button" className="btn small" onClick={() => photo("bi_back")} disabled={busy}>Ver BI: verso</button> : null}
        {bi === null ? <button type="button" className="btn small" onClick={() => number("bi")} disabled={busy}>Ver número do BI</button> : null}
        {ident.passport_last4 ? <button type="button" className="btn small" onClick={() => photo("passport")} disabled={busy}>Ver passaporte: 2.ª página</button> : null}
        {ident.passport_last4 && ident.has_passport_last ? <button type="button" className="btn small" onClick={() => photo("passport_last")} disabled={busy}>Ver passaporte: última página</button> : null}
        {ident.passport_last4 && pp === null ? <button type="button" className="btn small" onClick={() => number("passport")} disabled={busy}>Ver passaporte</button> : null}
        {ident.status !== "confirmado" ? (
          <form action={setIdentityStatus.bind(null, userId, "confirmado")} className="inline"><SubmitButton className="btn small primary" pending="A guardar…">Confirmar identificação</SubmitButton></form>
        ) : null}
        {ident.status !== "recusado" ? (
          <form action={setIdentityStatus.bind(null, userId, "recusado")} className="inline"><SubmitButton className="btn small danger" pending="A guardar…">Recusar</SubmitButton></form>
        ) : null}
      </div>
      {safety ? (
        <div className="kv">
          <div><span>Morada</span>{safety.address ?? "—"}</div>
          <div><span>Estado civil</span>{CIVIL.find(([k]) => k === safety.civil)?.[1] ?? "—"}</div>
          {(safety.family ?? []).map((f) => <div key={f.rel + f.phone}><span>{REL_LABEL[f.rel as FamilyRel] ?? f.rel}</span>{f.name} · {f.phone}</div>)}
        </div>
      ) : (
        <div className="row"><button type="button" className="btn small" onClick={showSafety} disabled={busy}>Ver morada e familiares</button></div>
      )}
      {msg ? <p className="err" role="alert">{msg}</p> : null}
    </div>
  );
}
