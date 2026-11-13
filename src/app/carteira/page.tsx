import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLedger, getWallet } from "@/lib/data";
import { fdate, kz } from "@/lib/format";

export const metadata: Metadata = { title: "Carteira" };

const KIND: Record<string, [string, "in" | "out" | "info"]> = {
  retido: ["Pagamento retido", "info"],
  a_receber: ["A receber", "info"],
  libertado: ["Valor libertado ao viajante", "out"],
  recebido: ["Recebido", "in"],
  reembolso: ["Reembolsado", "in"],
  comissao: ["Comissão da Kamba", "info"],
};

export default async function CarteiraPage() {
  await requireUser();
  const [w, ledger] = await Promise.all([getWallet(), getLedger()]);
  const tiles: [string, number, string][] = [
    ["Retido", w.held, "À espera de a entrega ser confirmada"],
    ["A receber", w.to_receive, "Entregas em curso que levas"],
    ["Recebido", w.received, "Já pago pela equipa"],
    ["Reembolsado", w.refunded, "Devolvido por entregas canceladas"],
  ];
  return (
    <section>
      <h2>Carteira</h2>
      <p className="muted">Quando a equipa confirma um pagamento, o valor fica retido até a entrega ser confirmada com o código. O dinheiro entra e sai por transferência ou Multicaixa, confirmado pela equipa.</p>
      <div className="stats">
        {tiles.map(([name, v, hint]) => (
          <div key={name}><span className="label">{name}</span><b>{kz(v)}</b><span className="hint">{hint}</span></div>
        ))}
      </div>

      <h3>Movimentos</h3>
      {ledger.length ? (
        <div className="rows ledger">
          {ledger.map((m) => {
            const [name, dir] = KIND[m.kind] ?? [m.kind, "info"];
            return (
              <div className="r" key={m.id}>
                <div><b>{name}</b><span className="sub">{m.note}</span></div>
                <div><b className={dir === "in" ? "pos" : ""}>{kz(m.amount)}</b><span className="sub">{fdate(m.created_at.slice(0, 10))}</span></div>
                {m.deal_id ? <Link className="btn small" href={`/entregas/${m.deal_id}`}>Ver entrega</Link> : <span />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty"><h3>Ainda sem movimentos</h3><p>Aparecem aqui quando a equipa confirmar o primeiro pagamento.</p></div>
      )}
    </section>
  );
}
