import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmDelivery } from "@/components/ConfirmDelivery";
import { DeliveryMap } from "@/components/DeliveryMap";
import { LocationSharer } from "@/components/LocationSharer";
import { PickupPanel } from "@/components/PickupPanel";
import { getProfile, requireUser } from "@/lib/auth";
import { DEAL_STEPS } from "@/lib/constants";
import { getDeal, getDealPhotos, getDeliveryCode, getPositions } from "@/lib/data";
import { fdate, kz } from "@/lib/format";

export const metadata: Metadata = { title: "Entrega" };

const FOR_SENDER: Record<string, string> = {
  negociacao: "A equipa está a combinar contigo o pagamento.",
  garantia: "O pagamento está retido. À espera de que o entregador pegue a encomenda.",
  transito: "A encomenda vai a caminho. Acompanha-a no mapa.",
  entregue: "Entrega confirmada. A equipa vai pagar ao viajante.",
  liberado: "Entrega concluída. O valor foi libertado ao viajante.",
  cancelado: "Entrega cancelada.",
};
const FOR_TRAVELER: Record<string, string> = {
  negociacao: "A equipa está a acertar o pagamento. Ainda não podes pegar a encomenda.",
  garantia: "O pagamento está retido. Podes pegar a encomenda.",
  transito: "Estás a levar a encomenda. Quando entregares, confirma com o código.",
  entregue: "Entrega confirmada. A equipa vai pagar-te o valor retido.",
  liberado: "Entrega concluída e paga.",
  cancelado: "Entrega cancelada.",
};

export default async function EntregaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const [profile, deal] = await Promise.all([getProfile(), getDeal(id)]);
  if (!deal) notFound(); // quem não participa nesta entrega também não a vê (regras de acesso)

  const admin = profile?.role === "admin";
  const isSender = deal.sender_id === user.id;
  const isTraveler = deal.traveler_id === user.id;
  const text = (isTraveler ? FOR_TRAVELER : FOR_SENDER)[deal.status] ?? "";
  const idx = DEAL_STEPS.findIndex((s) => s[0] === deal.status);
  const cancelled = deal.status === "cancelado";

  const [positions, code, shots] = await Promise.all([
    deal.status === "transito" && (isSender || admin) ? getPositions(id) : Promise.resolve([]),
    isSender && (deal.status === "garantia" || deal.status === "transito") ? getDeliveryCode(id) : Promise.resolve(null),
    getDealPhotos(id),
  ]);

  return (
    <section>
      <Link className="link" href="/entregas">← Entregas</Link>
      <div>
        <span className="label">{isTraveler ? "Levas esta encomenda" : isSender ? "Enviaste esta encomenda" : "Visão da equipa"} · {fdate(deal.created_at.slice(0, 10))}</span>
        <h2>{deal.label}</h2>
      </div>

      {cancelled ? <div className="notice bad">Entrega cancelada.</div> : (
        <ol className="tl" aria-label="Estado da entrega">
          {DEAL_STEPS.map(([k, name], i) => (
            <li key={k} className={i < idx ? "done" : i === idx ? "now" : ""} aria-current={i === idx ? "step" : undefined}>{name}</li>
          ))}
        </ol>
      )}
      {text ? <p className="statetext">{text}</p> : null}

      <div className="dealgrid">
        <div className="stack">
          {code ? (
            <div className="panel">
              <h3>Código de entrega</h3>
              <p className="muted">Dá este código só a quem recebe a encomenda, quando ela chegar. O entregador precisa dele para concluir a entrega.</p>
              <b className="bigcode">{code.slice(0, 3)} {code.slice(3)}</b>
            </div>
          ) : null}

          {isTraveler && deal.status === "garantia" ? <PickupPanel dealId={id} photos={shots.available ? shots.photos.length : null} /> : null}
          {isTraveler && deal.status === "transito" ? (
            <>
              <LocationSharer dealId={id} />
              <ConfirmDelivery dealId={id} />
            </>
          ) : null}

          {shots.photos.length ? (
            <div className="panel">
              <h3>Fotos do volume na recolha</h3>
              <p className="muted">Tiradas pelo entregador antes de pegar a encomenda.</p>
              <div className="thumbs big">
                {shots.photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"><img src={p.url} alt="Foto do volume na recolha" loading="lazy" /></a>
                ))}
              </div>
            </div>
          ) : null}

          {(isSender || admin) && deal.status === "transito" ? <DeliveryMap dealId={id} initial={positions} /> : null}
          {(isSender || admin) && deal.status === "garantia" ? <p className="muted">O mapa aparece quando o entregador pegar a encomenda.</p> : null}
          {deal.status === "entregue" || deal.status === "liberado" ? <p className="muted">A localização foi apagada quando a entrega terminou.</p> : null}
        </div>

        <aside className="aside">
          <h3>Valores</h3>
          <div className="kv one">
            <div><span>Valor da entrega</span>{kz(deal.price)}</div>
            <div><span>Comissão da Kamba ({deal.commission_pct}%)</span>{kz(deal.commission)}</div>
            <div><span>O viajante recebe</span>{kz(deal.price - deal.commission)}</div>
          </div>
          <p className="hint">O valor fica retido até a entrega ser confirmada com o código. <Link href="/carteira">Ver a carteira</Link></p>
        </aside>
      </div>
    </section>
  );
}
