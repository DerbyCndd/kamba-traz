import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { fdate } from "@/lib/format";
import type { DealReport, ReportKind } from "@/lib/types";
import { setReportStatus } from "../actions";

const KIND: Record<ReportKind, string> = {
  nao_recebida: "Encomenda não chegou", volume_diferente: "Volume ou conteúdo diferente", item_proibido: "Item proibido ou suspeito", conduta: "Comportamento", outro: "Outro",
};
const STATUS = { aberta: ["warn", "ABERTA"], em_analise: ["info", "EM ANÁLISE"], resolvida: ["ok", "RESOLVIDA"] } as const;

/** Denúncias feitas por quem participa numa entrega. A outra parte não as vê. */
export function Denuncias({ rows, names }: { rows: DealReport[]; names: Record<string, string> }) {
  if (!rows.length) return <div className="empty"><h3>Sem denúncias</h3><p>Quando alguém denunciar um problema numa entrega, aparece aqui.</p></div>;
  return (
    <div className="list">
      {rows.map((r) => {
        const [sc, st] = STATUS[r.status];
        return (
          <article className="item" key={r.id}>
            <div className="head">
              <div className="row"><span className="pill bad">{KIND[r.kind]}</span><span className="label">{fdate(r.created_at.slice(0, 10))}</span></div>
              <span className={"pill " + sc}>{st}</span>
            </div>
            <p className="fbmsg">{r.message}</p>
            <div className="kv">
              <div><span>Quem denunciou</span>{names[r.reporter_id] || "—"}</div>
              <div><span>Entrega</span><Link href={"/entregas/" + r.deal_id}>Abrir a entrega</Link></div>
            </div>
            <div className="row">
              {r.status !== "em_analise" ? <form action={setReportStatus.bind(null, r.id, "em_analise")} className="inline"><SubmitButton className="btn small" pending="A guardar…">Em análise</SubmitButton></form> : null}
              {r.status !== "resolvida" ? <form action={setReportStatus.bind(null, r.id, "resolvida")} className="inline"><SubmitButton className="btn small primary" pending="A guardar…">Resolvida</SubmitButton></form> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
