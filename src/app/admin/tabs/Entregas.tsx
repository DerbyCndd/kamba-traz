import { SubmitButton } from "@/components/SubmitButton";
import { TwoStepButton } from "@/components/TwoStepButton";
import { DEAL_STEPS } from "@/lib/constants";
import { kz } from "@/lib/format";
import type { Deal, Offer, Req, Trip, WaiverHolder } from "@/lib/types";
import { deleteDeal, setDealStatus } from "../actions";
import Link from "next/link";
import { ConfirmPayment } from "./ConfirmPayment";
import { Agreements } from "./Agreements";
import { DealForm } from "./DealForm";
import { PickupInfo } from "./PickupInfo";

export function Entregas({ trips, reqs, deals, commission, holders, agreements }: { trips: Trip[]; reqs: Req[]; deals: Deal[]; commission: number; holders: WaiverHolder[]; agreements: Offer[] }) {
  const openReqs = reqs.filter((r) => r.status === "aberto");
  const openTrips = trips.filter((t) => t.status === "aberto" || t.status === "cheia");
  return (
    <div className="list">
      <Agreements offers={agreements} reqs={openReqs} trips={openTrips} />
      <DealForm reqs={openReqs} trips={openTrips} commission={commission} holders={holders} />
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
              <div className="row">
                {d.fee_waived ? <span className="pill prize" title="Prémio do mês: sem comissão">SEM TAXA</span> : null}
                <span className={"pill " + cls}>{cancelled ? "CANCELADO" : (DEAL_STEPS[idx]?.[1] ?? d.status).toUpperCase()}</span>
              </div>
            </div>
            <div className="kv">
              <div><span>Valor</span>{kz(d.price)}</div>
              <div><span>Comissão ({d.commission_pct}%)</span>{kz(d.commission)}</div>
              <div><span>Viajante recebe</span>{kz(d.price - d.commission)}</div>
            </div>
            <PickupInfo r={reqs.find((x) => x.id === d.request_id)} />
            <div className="row">
              {d.status === "negociacao" ? <ConfirmPayment dealId={d.id} /> : null}
              {d.status === "garantia" ? <span className="hint">Pagamento retido. À espera de o entregador recolher a encomenda na app.</span> : null}
              {d.status === "recolhido" ? <span className="hint">Recolhida, com fotos. À espera de o entregador partir.</span> : null}
              {d.status === "transito" ? <span className="hint">Em viagem. A entrega fecha quando o entregador introduzir o código.</span> : null}
              {d.status === "entregue" && next ? (
                <form action={setDealStatus.bind(null, d.id, next[0])} className="inline">
                  <SubmitButton className="btn small primary" pending="A guardar…">Marcar: {next[1]} (depois de pagares ao viajante)</SubmitButton>
                </form>
              ) : null}
              <Link className="btn small" href={`/entregas/${d.id}`}>Ver entrega</Link>
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
