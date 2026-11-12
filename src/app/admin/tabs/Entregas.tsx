import { SubmitButton } from "@/components/SubmitButton";
import { TwoStepButton } from "@/components/TwoStepButton";
import { DEAL_STEPS } from "@/lib/constants";
import { kz } from "@/lib/format";
import type { Deal, Req, Trip } from "@/lib/types";
import { deleteDeal, setDealStatus } from "../actions";
import { DealForm } from "./DealForm";

export function Entregas({ trips, reqs, deals, commission }: { trips: Trip[]; reqs: Req[]; deals: Deal[]; commission: number }) {
  const openReqs = reqs.filter((r) => r.status === "aberto");
  const openTrips = trips.filter((t) => t.status === "aberto" || t.status === "cheia");
  return (
    <div className="list">
      <DealForm reqs={openReqs} trips={openTrips} commission={commission} />
      {deals.length ? <div className="row"><a className="btn small" href="/admin/export">Exportar entregas (CSV)</a></div> : null}
      {deals.length ? deals.map((d) => {
        const idx = DEAL_STEPS.findIndex((s) => s[0] === d.status);
        const cancelled = d.status === "cancelado";
        const next = !cancelled && idx >= 0 && idx < DEAL_STEPS.length - 1 ? DEAL_STEPS[idx + 1] : null;
        const cls = cancelled ? "bad" : d.status === "liberado" ? "ok" : d.status === "negociacao" ? "warn" : "info";
        return (
          <article className="item" key={d.id}>
            <div className="head">
              <div><span className="label">{d.traveler} leva o pedido de {d.requester}</span><h3>{d.label}</h3></div>
              <span className={"pill " + cls}>{cancelled ? "CANCELADO" : (DEAL_STEPS[idx]?.[1] ?? d.status).toUpperCase()}</span>
            </div>
            <div className="kv">
              <div><span>Valor</span>{kz(d.price)}</div>
              <div><span>Comissão ({d.commission_pct}%)</span>{kz(d.commission)}</div>
              <div><span>Viajante recebe</span>{kz(d.price - d.commission)}</div>
            </div>
            <div className="row">
              {next ? (
                <form action={setDealStatus.bind(null, d.id, next[0])} className="inline">
                  <SubmitButton className="btn small primary" pending="A guardar…">Marcar: {next[1]}</SubmitButton>
                </form>
              ) : null}
              {!cancelled && d.status !== "liberado" ? <TwoStepButton label="Cancelar" action={setDealStatus.bind(null, d.id, "cancelado")} /> : null}
              <TwoStepButton label="Apagar" action={deleteDeal.bind(null, d.id)} />
            </div>
          </article>
        );
      }) : (
        <div className="empty"><h3>Ainda não há entregas</h3><p>Quando ligares um pedido a um viajante, acompanhas aqui o pagamento em garantia, o transporte e a libertação do dinheiro.</p></div>
      )}
    </div>
  );
}
