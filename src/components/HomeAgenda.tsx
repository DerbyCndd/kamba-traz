import Link from "next/link";
import type { AgendaItem } from "@/lib/agenda";
import { DEAL_FLOW, DEAL_LABEL } from "@/lib/deal-flow";
import { refCode } from "@/lib/format";
import type { Deal } from "@/lib/types";

/** Uma tarefa como etiqueta de bagagem: a referência no talão, o que fazer, e a ação. */
const STUB: Record<string, string> = { offers: "Propostas", verif: "Perfil" };
/** Nomes curtos para a rota (o nome completo fica no rótulo acessível). */
const SHORT: Record<string, string> = { negociacao: "Acordo", garantia: "Retido", recolhido: "Recolhido", transito: "Em viagem", entregue: "Entregue", liberado: "Pago" };

export function Tag({ it, first = false }: { it: AgendaItem; first?: boolean }) {
  return (
    <li className={"tag " + it.tone}>
      <div className="tag-stub" aria-hidden={it.ref ? undefined : true}>
        <span className="tag-hole" />
        <span className={it.ref ? "tag-ref" : "tag-word"}>{it.ref ?? STUB[it.key] ?? "Kamba"}</span>
      </div>
      <div className="tag-body">
        <b>{it.title}</b>
        <span>{it.detail}</span>
      </div>
      <Link className={"btn small" + (first ? " primary" : "")} href={it.href}>
        {it.cta}{it.ref ? <span className="sr"> ({it.ref})</span> : null}
      </Link>
    </li>
  );
}

/** Uma entrega em curso como cartão de embarque, com os 6 passos do caminho. */
export function Boarding({ d, me }: { d: Deal; me: string }) {
  const at = DEAL_FLOW.indexOf(d.status as (typeof DEAL_FLOW)[number]);
  return (
    <Link className="boarding" href={`/entregas/${d.id}`}>
      <div className="boarding-head">
        <span className="tag-ref">KT-{refCode(d.id)}</span>
        <span className="muted">{d.traveler_id === me ? "Levas" : "Envias"}</span>
      </div>
      <b className="boarding-title">{d.label}</b>
      <ol className="flightpath" aria-label={`Estado: ${DEAL_LABEL[d.status as keyof typeof DEAL_LABEL] ?? d.status}`}>
        {DEAL_FLOW.map((s, i) => (
          <li key={s} className={i < at ? "done" : i === at ? "now" : ""} aria-current={i === at ? "step" : undefined}>
            <span title={DEAL_LABEL[s]}>{SHORT[s]}</span>
          </li>
        ))}
      </ol>
    </Link>
  );
}

