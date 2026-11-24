import { SubmitButton } from "@/components/SubmitButton";
import { TwoStepButton } from "@/components/TwoStepButton";
import { ExBadge, StatusPill } from "@/components/ui";
import { REQ_STATES, TRIP_STATES } from "@/lib/constants";
import { fdate, kz } from "@/lib/format";
import type { TeamSuggestion } from "@/lib/match-data";
import { MatchApprove } from "./MatchApprove";
import type { Req, Trip } from "@/lib/types";
import { deleteItem, removeExamples, seedExamples } from "../actions";
import { StatusSelect } from "./StatusSelect";

export function Quadro({ trips, reqs, suggestions = [] }: { trips: Trip[]; reqs: Req[]; suggestions?: TeamSuggestion[] }) {
  const pub = (s: string) => s !== "pendente" && s !== "recusado";
  const T = trips.filter((t) => pub(t.status)), R = reqs.filter((r) => pub(r.status));
  const hasEx = trips.some((t) => t.example) || reqs.some((r) => r.example);
  return (
    <div className="list">
      <div className="panel">
        <h3>Sugestões de emparelhamento <span className="cnt">{suggestions.length}</span></h3>
        <p className="muted">O melhor par para cada pedido aberto: mesma rota, dentro do prazo, com espaço e abaixo do limite da alfândega. «Criar entrega» usa o valor que quem envia ofereceu; confirma-o com as duas partes antes do pagamento.</p>
        {suggestions.length ? (
          <ul className="matchlist">
            {suggestions.map(({ match, req, trip }) => (
              <li key={req.id + trip.id}>
                <div className="matchrow">
                  <span><b>{req.item}</b> ({req.kg} kg, {req.name}) com a viagem de <b>{trip.name}</b> a {fdate(trip.travel_date)}{req.offer ? <> · {kz(req.offer)}</> : null}</span>
                  <b className="matchscore" title="Compatibilidade, de 0 a 100">{match.score}<span className="sr"> de 100 de compatibilidade</span></b>
                </div>
                <p className="hint">{match.explanation}</p>
                <MatchApprove requestId={req.id} tripId={trip.id} />
              </li>
            ))}
          </ul>
        ) : <p className="hint">Sem pares compatíveis de momento. Aparecem aqui quando houver pedidos e viagens abertos com a mesma rota.</p>}
      </div>
      <div className="row">
        <form action={seedExamples} className="inline"><SubmitButton className="btn small" pending="A carregar…">Carregar exemplos</SubmitButton></form>
        {hasEx ? <TwoStepButton label="Remover exemplos" action={removeExamples} /> : null}
      </div>
      {T.map((t) => (
        <article className="item" key={t.id}>
          <div className="head">
            <div><span className="label">Viagem</span><h3>{t.origin} → {t.destination} · {fdate(t.travel_date)} · {t.name}</h3></div>
            <div className="row"><StatusPill status={t.status} /><ExBadge example={t.example} /></div>
          </div>
          <div className="row">
            <StatusSelect kind="trip" id={t.id} value={t.status} options={TRIP_STATES} />
            <TwoStepButton label="Apagar" action={deleteItem.bind(null, "trip", t.id)} />
          </div>
        </article>
      ))}
      {R.map((r) => (
        <article className="item" key={r.id}>
          <div className="head">
            <div><span className="label">Pedido</span><h3>{r.item} · {r.origin} → {r.destination}</h3></div>
            <div className="row"><StatusPill status={r.status} /><ExBadge example={r.example} /></div>
          </div>
          <div className="row">
            <StatusSelect kind="request" id={r.id} value={r.status} options={REQ_STATES} />
            <TwoStepButton label="Apagar" action={deleteItem.bind(null, "request", r.id)} />
          </div>
        </article>
      ))}
      {!T.length && !R.length ? (
        <div className="empty"><h3>O quadro está vazio</h3><p>Aprova entradas em “Por verificar” para as publicar. Para ver o site cheio, carrega os exemplos e remove-os quando quiseres.</p></div>
      ) : null}
    </div>
  );
}
