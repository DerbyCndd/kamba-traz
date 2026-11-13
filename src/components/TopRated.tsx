import { getLastWinners, getTopRated } from "@/lib/data";
import { monthLabel, PRIZE_MIN } from "@/lib/format";
import type { TopEntry } from "@/lib/types";
import { LiveRank } from "./LiveRank";
import { Stars } from "./Stars";

export function RankColumn({ title, list, empty }: { title: string; list: TopEntry[]; empty: string }) {
  // A lista chega ordenada: quem já tem o mínimo de avaliações do mês vem à frente. O 1.º com o mínimo ganha o prémio.
  const winner = list.length && list[0].total >= PRIZE_MIN ? 0 : -1;
  return (
    <div className="rank">
      <h3>{title}</h3>
      {list.length ? (
        <ol className="podium">
          {list.map((p, i) => (
            <li key={p.first_name + p.avg_stars + p.total} className={"p" + (i + 1)}>
              <span className="place" aria-label={`${i + 1}.º lugar`}>{i + 1}</span>
              <div className="who">
                <b>{p.first_name}</b>
                <Stars avg={p.avg_stars} count={p.total} />
                {i === winner ? <span className="pill prize">Mês seguinte sem taxas</span> : null}
                {p.total < PRIZE_MIN ? <small className="hint">Faltam {PRIZE_MIN - p.total} avaliações para o prémio</small> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rank-empty">{empty}</p>
      )}
    </div>
  );
}

/** Os 3 melhores de cada função, no mês corrente. As regras do prémio estão nas dúvidas. */
export async function TopRated() {
  const [{ travelers, requesters }, winners] = await Promise.all([getTopRated(), getLastWinners()]);
  const month = monthLabel();
  return (
    <section>
      <LiveRank />
      <h2>Melhores de {month}</h2>
      <p className="muted">O melhor de cada mês fica o mês seguinte sem taxas.</p>
      {winners.length ? (
        <p>Este mês sem taxas: {winners.map((w) => `${w.first_name} (${w.role === "traveler" ? "entregador" : "remetente"})`).join(" e ")}.</p>
      ) : null}
      <div className="two">
        <RankColumn title="Entregadores" list={travelers} empty="Ainda sem avaliações." />
        <RankColumn title="Remetentes" list={requesters} empty="Ainda sem avaliações." />
      </div>
    </section>
  );
}
