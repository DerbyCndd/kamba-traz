"use client";
import { useState, useTransition } from "react";
import { approveMatch, type AdminState } from "../actions";

/** Um clique: cria a entrega do par sugerido, com o valor que quem envia ofereceu. */
export function MatchApprove({ requestId, tripId }: { requestId: string; tripId: string }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<AdminState>({});
  return (
    <div className="row">
      <button type="button" className="btn small primary" disabled={pending || !!res.message} onClick={() => start(async () => setRes(await approveMatch(requestId, tripId)))}>
        {pending ? "A criar…" : res.message ? "Entrega criada" : "Criar entrega"}
      </button>
      {res.message ? <span className="hint" role="status">{res.message}</span> : null}
      {res.error ? <span className="err" role="alert">{res.error}</span> : null}
    </div>
  );
}
