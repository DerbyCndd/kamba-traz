import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DEAL_STEPS } from "@/lib/constants";
import { getMyDeals } from "@/lib/data";
import { fdate, kz } from "@/lib/format";

export const metadata: Metadata = { title: "Entregas" };

export default async function EntregasPage() {
  const { user } = await requireUser();
  const deals = await getMyDeals();
  const label = (s: string) => (s === "cancelado" ? "Cancelada" : (DEAL_STEPS.find((x) => x[0] === s)?.[1] ?? s));
  const cls = (s: string) => (s === "cancelado" ? "bad" : s === "liberado" || s === "entregue" ? "ok" : s === "negociacao" ? "warn" : "info");

  return (
    <section>
      <h2>Entregas</h2>
      <p className="muted">As entregas em que participas, com o estado do pagamento e o acompanhamento.</p>
      {deals.length ? (
        <div className="list">
          {deals.map((d) => {
            const role = d.traveler_id === user.id ? "Levas" : d.sender_id === user.id ? "Envias" : "Equipa";
            return (
              <Link className="item dealrow" key={d.id} href={`/entregas/${d.id}`}>
                <div className="head">
                  <div><span className="label">{role} · {fdate(d.created_at.slice(0, 10))}</span><h3>{d.label}</h3></div>
                  <span className={"pill " + cls(d.status)}>{label(d.status)}</span>
                </div>
                <div className="kv"><div><span>Valor</span>{kz(d.price)}</div></div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty"><h3>Ainda não tens entregas</h3><p>Aparecem aqui quando a equipa te ligar a um pedido ou a uma viagem.</p></div>
      )}
    </section>
  );
}
