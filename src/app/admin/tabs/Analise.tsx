import { kz, pct, today } from "@/lib/format";
import type { Deal, Req, Trip } from "@/lib/types";

export function Analise({ trips, reqs, deals }: { trips: Trip[]; reqs: Req[]; deals: Deal[] }) {
  const real = [...trips, ...reqs].filter((x) => !x.example);
  const subs = real.length;
  const approved = real.filter((x) => x.status !== "pendente" && x.status !== "recusado").length;
  const done = deals.filter((d) => d.status === "liberado").length;
  const steps: [string, number][] = [["Entradas recebidas", subs], ["Aprovadas e publicadas", approved], ["Ligadas a viajante", deals.length], ["Entregas concluídas", done]];
  const mx = Math.max(1, ...steps.map((s) => s[1]));

  const m: Record<string, { s: number; d: number }> = {};
  trips.filter((t) => t.status === "aberto" && t.travel_date >= today()).forEach((t) => { (m[`${t.origin} → ${t.destination}`] ??= { s: 0, d: 0 }).s += Number(t.kg) || 0; });
  reqs.filter((r) => r.status === "aberto").forEach((r) => { (m[`${r.origin} → ${r.destination}`] ??= { s: 0, d: 0 }).d += Number(r.kg) || 0; });
  const rows = Object.entries(m).map(([k, v]) => ({ k, s: v.s, d: v.d, gap: v.d - v.s })).sort((a, b) => Math.max(b.s, b.d) - Math.max(a.s, a.d));
  const rmx = Math.max(1, ...rows.map((r) => Math.max(r.s, r.d)));

  let insight = "Sem dados de rotas ainda.";
  if (rows.length) {
    const short = [...rows].sort((a, b) => b.gap - a.gap)[0];
    const spare = [...rows].sort((a, b) => a.gap - b.gap)[0];
    insight = short.gap > 0 ? `Faltam ${short.gap} kg de espaço na rota ${short.k}. Recruta viajantes para esta rota primeiro.`
      : spare.gap < 0 ? `Há espaço livre de sobra na rota ${spare.k} (${-spare.gap} kg). Promove-a junto de quem quer enviar.`
      : "Oferta e procura estão equilibradas.";
  }
  const avg = deals.length ? deals.reduce((a, d) => a + d.price, 0) / deals.length : 0;
  const bar = (label: string, v: number, color: string) => (
    <div className="btrack" title={`${label}: ${v} kg`}>
      <div className="bfillw"><div className="bfill" style={{ width: (v / rmx) * 100 + "%", background: color }} /></div>
      <span className="bval">{v} kg</span>
    </div>
  );

  return (
    <div className="list">
      <div className="stats">
        <div><span className="label">Taxa de aprovação</span><b>{pct(approved, subs)}</b></div>
        <div><span className="label">Conversão até entrega</span><b>{pct(done, subs)}</b></div>
        <div><span className="label">Valor médio por entrega</span><b>{avg ? kz(avg) : "–"}</b></div>
      </div>

      <div className="panel">
        <h3>Do primeiro contacto à entrega</h3>
        <p className="hint">Onde perdes pessoas pelo caminho.</p>
        <div role="img" aria-label={"Funil: " + steps.map((s) => `${s[0]} ${s[1]}`).join(", ")}>
          {steps.map(([name, n], i) => (
            <div className="brow" key={name} title={`${name}: ${n}`}>
              <div className="nm">{name}</div>
              <div className="btrack">
                <div className="bfillw"><div className="bfill" style={{ width: (n / mx) * 100 + "%", background: "var(--s1)" }} /></div>
                <span className="bval">{n}{i ? ` · ${pct(n, steps[i - 1][1])} do passo anterior` : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Espaço dos viajantes contra procura, por rota</h3>
        <p className="notice">{insight}</p>
        {rows.length ? (
          <>
            <div className="legend">
              <span><i className="sw" style={{ background: "var(--s1)" }} />Espaço dos viajantes</span>
              <span><i className="sw" style={{ background: "var(--s2)" }} />Procura dos pedidos</span>
            </div>
            <div role="img" aria-label={"Espaço e procura em kg por rota. " + insight}>
              {rows.map((r) => (
                <div className="brow" key={r.k}>
                  <div className="nm">{r.k}</div>
                  <div className="btracks">{bar("Espaço dos viajantes", r.s, "var(--s1)")}{bar("Procura dos pedidos", r.d, "var(--s2)")}</div>
                </div>
              ))}
            </div>
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 600, minHeight: 36 }}>Ver como tabela</summary>
              <div className="tablewrap">
                <table className="rtbl">
                  <thead><tr><th>Rota</th><th className="num">Espaço (kg)</th><th className="num">Procura (kg)</th><th className="num">Diferença</th></tr></thead>
                  <tbody>{rows.map((r) => <tr key={r.k}><td>{r.k}</td><td className="num">{r.s}</td><td className="num">{r.d}</td><td className="num">{r.gap > 0 ? "+" : ""}{r.gap}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          </>
        ) : (
          <div className="empty"><p>Quando houver viagens e pedidos abertos, vês aqui onde falta espaço e onde sobra. Usa “Carregar exemplos” no separador Quadro para ver como fica.</p></div>
        )}
      </div>
    </div>
  );
}
