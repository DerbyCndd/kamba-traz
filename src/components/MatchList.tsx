import Link from "next/link";
import { fdate, kz } from "@/lib/format";
import type { RequestSuggestion, TripSuggestion } from "@/lib/match-data";

/** A pontuação de compatibilidade, com nome legível também para leitores de ecrã. */
function Score({ n }: { n: number }) {
  return <b className="matchscore" title="Compatibilidade, de 0 a 100">{n}<span className="sr"> de 100 de compatibilidade</span></b>;
}

/** Para quem envia: as viagens que servem este pedido. Só dados públicos, sem contactos. */
export function TripSuggestions({ items }: { items: TripSuggestion[] }) {
  return (
    <div className="matches">
      <h4>Viagens sugeridas</h4>
      {items.length ? (
        <ul className="matchlist">
          {items.map(({ match, trip }) => (
            <li key={trip.id}>
              <div className="matchrow">
                <span><b>{trip.name || "Viajante"}</b> · {fdate(trip.travel_date)} · {trip.kg} kg livres · {kz(trip.per_kg)}/kg</span>
                <Score n={match.score} />
              </div>
              <p className="hint">{match.explanation}</p>
              <Link className="btn small" href={`/propostas/nova?viagem=${trip.id}`}>Propor valor</Link>
            </li>
          ))}
        </ul>
      ) : <p className="hint">Ainda não há viagens compatíveis com este pedido. As viagens novas aparecem aqui.</p>}
    </div>
  );
}

/** Para quem viaja: os pedidos que cabem na mala. Só dados públicos, sem o valor do item nem contactos. */
export function RequestSuggestions({ items }: { items: RequestSuggestion[] }) {
  return (
    <div className="matches">
      <h4>Pedidos que cabem na tua mala</h4>
      {items.length ? (
        <ul className="matchlist">
          {items.map(({ match, req }) => (
            <li key={req.id}>
              <div className="matchrow">
                <span><b>{req.item}</b> · {req.kg} kg · {req.name || "Quem envia"}{req.offer ? <> · oferece {kz(req.offer)}</> : null}{req.deadline ? <> · até {fdate(req.deadline)}</> : null}</span>
                <Score n={match.score} />
              </div>
              <p className="hint">{match.explanation}</p>
              <Link className="btn small" href={`/propostas/nova?pedido=${req.id}`}>Propor valor</Link>
            </li>
          ))}
        </ul>
      ) : <p className="hint">Ainda não há pedidos que caibam nesta viagem. Os pedidos novos aparecem aqui.</p>}
    </div>
  );
}
