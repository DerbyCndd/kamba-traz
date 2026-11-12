"use client";
import { useState } from "react";
import { kz } from "@/lib/format";

const DEFS: [keyof E, string, number][] = [
  ["n", "Entregas por mês", 1], ["kg", "Kg médios por entrega", 0.5], ["perKg", "Preço por kg (Kz)", 500], ["com", "Comissão da Kamba (%)", 0.5],
  ["pay", "Taxa do meio de pagamento (%)", 0.1], ["res", "Reserva para sinistros (% do valor)", 0.1], ["sup", "Custo de apoio por entrega (Kz)", 100],
  ["fix", "Custos fixos por mês (Kz)", 5000], ["cac", "Custo de conquistar um cliente (Kz)", 500], ["courier", "Correio expresso, preço por kg (Kz)", 1000],
];
type E = { n: number; kg: number; perKg: number; com: number; pay: number; res: number; sup: number; fix: number; cac: number; courier: number };

export function Economia({ perKg, commission }: { perKg: number; commission: number }) {
  const [E, setE] = useState<E>({ n: 40, kg: 6, perKg, com: commission, pay: 3, res: 1.5, sup: 1500, fix: 150000, cac: 4000, courier: 25000 });
  const calc = (n: number) => {
    const gmv = n * E.kg * E.perKg, rev = (gmv * E.com) / 100, pay = (gmv * E.pay) / 100, res = (gmv * E.res) / 100, sup = n * E.sup;
    const cm = rev - pay - res - sup;
    return { gmv, rev, pay, res, sup, cm, profit: cm - E.fix };
  };
  const c = calc(E.n);
  const per = (E.kg * E.perKg * (E.com - E.pay - E.res)) / 100 - E.sup;
  const be = per > 0 ? Math.ceil(E.fix / per) : null;
  const pb = per > 0 ? Math.ceil(E.cac / per) : null;
  const save = E.courier > 0 ? Math.round((1 - E.perKg / E.courier) * 100) : 0;
  const ln = (a: string, b: string, cls = "") => <div className="ln"><span>{a}</span><b className={cls}>{b}</b></div>;

  return (
    <div className="list">
      <div className="notice">Estes números são premissas ilustrativas, como ponto de partida. Substitui cada um pelo que for real (cotações do correio, taxa do meio de pagamento, os teus custos). O resultado só vale tanto quanto elas.</div>
      <div className="econ">
        <div className="panel">
          <h3>Premissas</h3>
          <div className="fields" style={{ gridTemplateColumns: "1fr" }}>
            {DEFS.map(([k, label, step]) => (
              <div className="field" key={k}>
                <label htmlFor={"e-" + k}>{label}</label>
                <input id={"e-" + k} type="number" min="0" step={step} inputMode="decimal" value={E[k]} onChange={(e) => setE({ ...E, [k]: parseFloat(e.target.value) || 0 })} />
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Resultado por mês</h3>
          {per <= 0 ? <div className="notice bad">Cada entrega dá prejuízo com estas premissas. Sobe a comissão, o peso médio ou o preço por kg, ou baixa os custos.</div> : null}
          <div>
            {ln("Valor movimentado", kz(c.gmv))}
            {ln("Comissão recebida", kz(c.rev))}
            {ln("Taxas do meio de pagamento", "− " + kz(c.pay))}
            {ln("Reserva para sinistros", "− " + kz(c.res))}
            {ln("Apoio ao cliente", "− " + kz(c.sup))}
            {ln("Margem de contribuição", kz(c.cm))}
            {ln("Custos fixos", "− " + kz(E.fix))}
            {ln("Lucro do mês", kz(c.profit), c.profit >= 0 ? "pos" : "neg")}
          </div>
          <div className="stats">
            <div><span className="label">Margem por entrega</span><b className={per > 0 ? "" : "neg"}>{kz(per)}</b></div>
            <div><span className="label">Ponto de equilíbrio</span><b>{be ? be + " entregas" : "–"}</b></div>
            <div><span className="label">Recuperar custo de cliente</span><b>{pb ? pb + " entrega" + (pb > 1 ? "s" : "") : "–"}</b></div>
          </div>
          {E.courier > 0 ? <p className="hint">O cliente paga {kz(E.perKg)}/kg contra {kz(E.courier)}/kg no correio expresso: {save > 0 ? `poupa ${save}%.` : "não poupa."}</p> : null}
          <h3>Cenários</h3>
          <div className="tablewrap">
            <table className="rtbl">
              <thead><tr><th className="num">Entregas/mês</th><th className="num">Comissão</th><th className="num">Lucro</th></tr></thead>
              <tbody>
                {[10, 30, 60, 100, 200].map((n) => { const x = calc(n); return <tr key={n}><td className="num">{n}</td><td className="num">{kz(x.rev)}</td><td className={"num " + (x.profit >= 0 ? "pos" : "neg")}>{kz(x.profit)}</td></tr>; })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
