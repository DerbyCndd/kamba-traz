import { SubmitButton } from "@/components/SubmitButton";
import { TwoStepButton } from "@/components/TwoStepButton";
import { fdate } from "@/lib/format";
import type { FeedbackRow } from "@/lib/types";
import { deleteFeedback, setFeedbackStatus } from "../actions";

const KIND = { elogio: ["ok", "Elogio"], ideia: ["info", "Ideia"], problema: ["bad", "Problema"], outro: ["ex", "Outro"] } as const;
const STATUS = { novo: ["warn", "NOVO"], lido: ["info", "LIDO"], resolvido: ["ok", "RESOLVIDO"] } as const;

/** O que as pessoas escreveram em «Deixe o seu feedback». */
export function FeedbackTab({ rows }: { rows: FeedbackRow[] }) {
  if (!rows.length) return <div className="empty"><h3>Ainda sem feedback</h3><p>O que as pessoas escreverem em «Deixe o seu feedback» aparece aqui.</p></div>;
  return (
    <div className="list">
      {rows.map((r) => {
        const [kc, kt] = KIND[r.kind]; const [sc, st] = STATUS[r.status];
        return (
          <article className="item" key={r.id}>
            <div className="head">
              <div className="row"><span className={"pill " + kc}>{kt}</span><span className="label">{fdate(r.created_at.slice(0, 10))}{r.page ? " · " + r.page : ""}</span></div>
              <span className={"pill " + sc}>{st}</span>
            </div>
            <p className="fbmsg">{r.message}</p>
            <div className="kv">
              {r.rating ? <div><span>Avaliação</span>{r.rating} de 5</div> : null}
              {r.email ? <div><span>Email</span><a href={`mailto:${r.email}`}>{r.email}</a></div> : null}
              <div><span>Quem</span>{r.user_id ? "Utilizador com conta" : "Visitante"}</div>
            </div>
            <div className="row">
              {r.status !== "lido" ? <form action={setFeedbackStatus.bind(null, r.id, "lido")} className="inline"><SubmitButton className="btn small" pending="A guardar…">Marcar como lido</SubmitButton></form> : null}
              {r.status !== "resolvido" ? <form action={setFeedbackStatus.bind(null, r.id, "resolvido")} className="inline"><SubmitButton className="btn small primary" pending="A guardar…">Resolvido</SubmitButton></form> : null}
              <TwoStepButton label="Apagar" action={deleteFeedback.bind(null, r.id)} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
