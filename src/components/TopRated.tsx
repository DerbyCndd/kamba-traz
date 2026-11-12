import { getTopRated } from "@/lib/data";
import type { TopEntry } from "@/lib/types";
import { initials } from "@/lib/format";
import { Stars } from "./Stars";

export function RankColumn({ title, text, list, empty }: { title: string; text: string; list: TopEntry[]; empty: string }) {
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
              <div className="who"><b>{p.first_name}</b><Stars avg={p.avg_stars} count={p.total} /></div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rank-empty">{empty}</p>
      )}
    </div>
  );
}

/** Os 3 mais bem classificados de cada função. Cada pessoa tem uma classificação como entregador e outra como remetente. */
export async function TopRated() {
  const { travelers, requesters } = await getTopRated();
  return (
    <section>
      <h2>Os mais bem avaliados</h2>
      <p className="muted">Depois de cada entrega, as duas partes avaliam-se. Cada pessoa tem uma classificação como entregador e outra como remetente.</p>
      <div className="two">
        <RankColumn title="Entregadores" text="Quem leva as encomendas na mala" list={travelers} empty="Ainda sem avaliações. Aparecem aqui os 3 melhores depois das primeiras entregas concluídas." />
        <RankColumn title="Remetentes" text="Quem pede o envio das encomendas" list={requesters} empty="Ainda sem avaliações. Aparecem aqui os 3 melhores depois das primeiras entregas concluídas." />
      </div>
    </section>
  );
}
