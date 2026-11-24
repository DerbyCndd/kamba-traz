import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmDelivery } from "@/components/ConfirmDelivery";
import { DealContacts } from "@/components/DealContacts";
import { DeliveryMap } from "@/components/DeliveryMap";
import { LocationSharer } from "@/components/LocationSharer";
import { PickupPanel } from "@/components/PickupPanel";
import { DeliveryCodePanel } from "@/components/DeliveryCodePanel";
import { StartTrip } from "@/components/StartTrip";
import { DEAL_LABEL, codeAllowed, type DealStatus } from "@/lib/deal-flow";
import { ReportForm } from "@/components/ReportForm";
import { getProfile, requireUser } from "@/lib/auth";
import { DEAL_STEPS } from "@/lib/constants";
import { getDeal, getDealPhotos, getDealContacts, getDeliveryCode, getMyReports, getPositions } from "@/lib/data";
import { fdate, kz } from "@/lib/format";

export const metadata: Metadata = { title: "Entrega" };

const FOR_SENDER: Record<string, string> = {
  negociacao: "A equipa está a combinar contigo o pagamento.",
  garantia: "O pagamento está retido. Gera o código de entrega e dá-o a quem recebe. À espera de que o entregador recolha a encomenda.",
  recolhido: "O entregador recolheu a encomenda, com fotos do volume. À espera de que parta.",
  transito: "A encomenda está em viagem. Acompanha-a no mapa.",
  entregue: "Entrega confirmada. A equipa vai pagar ao viajante.",
  liberado: "Entrega concluída. O valor foi libertado ao viajante.",
  cancelado: "Entrega cancelada.",
};
const FOR_TRAVELER: Record<string, string> = {
  negociacao: "A equipa está a acertar o pagamento. Ainda não podes pegar a encomenda.",
  garantia: "O pagamento está retido. Podes recolher a encomenda.",
  recolhido: "Recolheste a encomenda. Quando partires, confirma que estás em viagem.",
  transito: "Estás em viagem com a encomenda. Quando entregares, confirma com o código de quem recebe.",
  entregue: "Entrega confirmada. A equipa vai pagar-te o valor retido.",
  liberado: "Entrega concluída e paga.",
  cancelado: "Entrega cancelada.",
};

export default async function EntregaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase } = await requireUser();
  const [profile, deal] = await Promise.all([getProfile(), getDeal(id)]);
  if (!deal) notFound(); // quem não participa nesta entrega também não a vê (regras de acesso)

  const admin = profile?.role === "admin";
  const isSender = deal.sender_id === user.id;
  const isTraveler = deal.traveler_id === user.id;
  const text = (isTraveler ? FOR_TRAVELER : FOR_SENDER)[deal.status] ?? "";
  const idx = DEAL_STEPS.findIndex((s) => s[0] === deal.status);
  const cancelled = deal.status === "cancelado";

  const reports = isSender || isTraveler ? await getMyReports(id) : { available: false, reports: [] };
  const contacts = isSender || isTraveler ? await getDealContacts(id) : null;
  const [positions, code, shots] = await Promise.all([
    deal.status === "transito" && (isSender || admin) ? getPositions(id) : Promise.resolve([]),
    isSender && codeAllowed(deal.status) ? getDeliveryCode(id) : Promise.resolve(null), // só códigos antigos, ainda guardados cifrados
    getDealPhotos(id),
  ]);
  const codeState = isSender && codeAllowed(deal.status)
    ? await supabase.rpc("delivery_code_status", { p_deal: id }).then((r) => ((Array.isArray(r.data) ? r.data[0] : null) ?? null) as { has_code: boolean; expires_at: string | null } | null)
    : null;
  const history = await supabase.from("deal_history").select("id, to_status, at").eq("deal_id", id).order("at").then((r) => (r.error ? [] : (r.data ?? []) as { id: number; to_status: string; at: string }[]));

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
          {isSender && codeAllowed(deal.status) ? <DeliveryCodePanel dealId={id} hasCode={!!codeState?.has_code} expiresAt={codeState?.expires_at ?? null} legacy={code} /> : null}

          {contacts ? <DealContacts c={contacts} /> : null}
          {!contacts && deal.status === "negociacao" && (isTraveler || isSender) ? (
            <div className="panel">
              <h3>Contactos e recolha</h3>
              <p className="muted">{isTraveler
                ? "Quando o pagamento ficar retido, vês aqui o local onde pegar a encomenda, o contacto de quem envia e quem recebe em Angola."
                : "Quando o pagamento ficar retido, vês aqui o contacto do entregador, para combinarem a recolha."}</p>
            </div>
          ) : null}

          {isTraveler && deal.status === "garantia" ? <PickupPanel dealId={id} photos={shots.available ? shots.photos.length : null} /> : null}
          {isTraveler && deal.status === "recolhido" ? <StartTrip dealId={id} /> : null}
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
          {(isSender || admin) && (deal.status === "garantia" || deal.status === "recolhido") ? <p className="muted">O mapa aparece quando o entregador partir em viagem.</p> : null}
          {deal.status === "entregue" || deal.status === "liberado" ? <p className="muted">A localização foi apagada quando a entrega terminou.</p> : null}

          {reports.available && (isSender || isTraveler) ? (
            <div className="panel">
              <h3>Algo correu mal?</h3>
              <p className="muted">Se a encomenda não chegou, o volume é diferente do combinado ou algo parece errado, conta à equipa. A outra parte não vê a denúncia.</p>
              {reports.reports.length ? (
                <ul className="muted">
                  {reports.reports.map((r) => <li key={r.id}>{fdate(r.created_at.slice(0, 10))}: {r.status === "resolvida" ? "resolvida" : r.status === "em_analise" ? "a equipa está a analisar" : "recebida, à espera da equipa"}</li>)}
                </ul>
              ) : null}
              <details className="past">
                <summary>Denunciar um problema</summary>
                <ReportForm dealId={id} />
              </details>
            </div>
          ) : null}
        </div>

        <aside className="aside">
          <h3>Valores</h3>
          <div className="kv one">
            <div><span>Valor da entrega</span>{kz(deal.price)}</div>
            <div><span>Comissão da Kamba ({deal.commission_pct}%)</span>{kz(deal.commission)}</div>
            <div><span>O viajante recebe</span>{kz(deal.price - deal.commission)}</div>
          </div>
          <p className="hint">O valor fica retido até a entrega ser confirmada com o código. <Link href="/carteira">Ver a carteira</Link></p>
          {history.length ? (
            <>
              <h3>Histórico</h3>
              <ol className="history">
                {history.map((h) => <li key={h.id}><b>{DEAL_LABEL[h.to_status as DealStatus] ?? h.to_status}</b> <time dateTime={h.at}>{new Date(h.at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Luanda" })}</time></li>)}
              </ol>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
