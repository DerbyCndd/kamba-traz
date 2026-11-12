import { getTopRated } from "@/lib/data";
import { initials, monthLabel, PRIZE_MIN } from "@/lib/format";
import type { TopEntry } from "@/lib/types";
import { Stars } from "./Stars";

export function RankColumn({ title, text, list, empty }: { title: string; text: string; list: TopEntry[]; empty: string }) {
  // A lista chega ordenada: quem já tem o mínimo de avaliações do mês vem à frente. O 1.º com o mínimo ganha o prémio.
  const winner = list.length && list[0].total >= PRIZE_MIN ? 0 : -1;
  return (
    <div className="panel rank">
      <div>
        <h3>{title}</h3>
        <p className="hint">{text}</p>
      </div>
      {list.length ? (
        <ol className="podium">
          {list.map((p, i) => (
            <li key={i} className={"p" + (i + 1)}>
              <span className="place" aria-label={`${i + 1}.º lugar`}>{i + 1}</span>
              <span className="avatar sm" aria-hidden="true">{initials(p.first_name, p.first_name)}</span>
              <div className="who">
                <b>{p.first_name}</b>
                <Stars avg={p.avg_stars} count={p.total} />
                {i === winner ? <span className="pill prize">MÊS SEM TAXAS</span> : null}
                {p.total < PRIZE_MIN ? <small className="hint">Faltam {PRIZE_MIN - p.total} {PRIZE_MIN - p.total === 1 ? "avaliação" : "avaliações"} para concorrer ao prémio</small> : null}
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

/** Os 3 mais bem classificados de cada função, no mês corrente. O 1.º de cada função ganha um mês sem taxas. */
export async function TopRated() {
  const { travelers, requesters } = await getTopRated();
  const month = monthLabel();
  const empty = `Ainda sem avaliações em ${month}. O quadro enche à medida que as entregas do mês forem sendo avaliadas.`;
  return (
    <section>
      <h2>Os mais bem avaliados de {month}</h2>
      <div className="prize-note">
        <span className="prize-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg></span>
        <p>
          <b>Um mês sem pagar taxas.</b> No fim de cada mês, o entregador e o remetente mais bem avaliados ficam o mês seguinte sem pagar a taxa da Kamba.
          Para concorrer é preciso ter pelo menos {PRIZE_MIN} avaliações dentro do mês. A classificação recomeça no dia 1.
        </p>
      </div>
      <div className="two">
        <RankColumn title="Entregadores" text="Quem leva as encomendas na mala" list={travelers} empty={empty} />
        <RankColumn title="Remetentes" text="Quem pede o envio das encomendas" list={requesters} empty={empty} />
      </div>
    </section>
  );
}
