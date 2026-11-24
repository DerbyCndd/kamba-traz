"use client";
import { useState, useTransition } from "react";
import { newDeliveryCode } from "@/app/entregas/actions";
import { fdate } from "@/lib/format";

/**
 * Quem envia gera o código de entrega. O servidor cria-o, a base de dados guarda só o hash,
 * e o código aparece aqui uma única vez. Se se perder, gera-se outro e o anterior deixa de valer.
 */
export function DeliveryCodePanel({ dealId, hasCode, expiresAt, legacy }: { dealId: string; hasCode: boolean; expiresAt: string | null; legacy: string | null }) {
  const [pending, start] = useTransition();
  const [code, setCode] = useState<{ code: string; expires: string } | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const replacing = hasCode || !!legacy;

  function generate() {
    setError("");
    start(async () => {
      const r = await newDeliveryCode(dealId);
      if (r.error) setError(r.error);
      else if (r.code) { setCode({ code: r.code, expires: r.expires ?? "" }); setConfirm(false); }
    });
  }

  return (
    <div className="panel">
      <h3>Código de entrega</h3>
      {code ? (
        <>
          <p className="muted">Guarda-o agora: não o voltamos a mostrar. Dá-o só a quem recebe a encomenda, para o entregar ao entregador quando ela chegar.</p>
          <b className="bigcode" aria-label={`Código ${code.code.split("").join(" ")}`}>{code.code.slice(0, 3)} {code.code.slice(3)}</b>
          {code.expires ? <p className="hint">Válido até {fdate(code.expires.slice(0, 10))}.</p> : null}
        </>
      ) : legacy ? (
        <>
          <p className="muted">Dá este código só a quem recebe a encomenda, quando ela chegar.</p>
          <b className="bigcode">{legacy.slice(0, 3)} {legacy.slice(3)}</b>
        </>
      ) : (
        <p className="muted">{hasCode
          ? `Já geraste um código${expiresAt ? `, válido até ${fdate(expiresAt.slice(0, 10))}` : ""}. Por segurança não o guardamos: se o perdeste, gera um novo.`
          : "O pagamento está retido. Gera o código e dá-o a quem recebe a encomenda: sem ele, a entrega não fecha."}</p>
      )}
      {error ? <div className="notice bad" role="alert">{error}</div> : null}
      {!code ? (
        replacing && !confirm ? (
          <div className="row"><button type="button" className="btn small" onClick={() => setConfirm(true)}>Gerar um código novo</button></div>
        ) : (
          <div className="row">
            {replacing ? <span className="hint">O código anterior deixa de valer.</span> : null}
            <button type="button" className="btn small primary" disabled={pending} onClick={generate}>{pending ? "A gerar…" : replacing ? "Sim, gerar novo" : "Gerar o código"}</button>
          </div>
        )
      ) : null}
    </div>
  );
}
