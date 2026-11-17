import type { Req } from "@/lib/types";

const mapOk = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

/** Onde o entregador pega a encomenda e quem a recebe em Angola, para a equipa ver ao aprovar o pedido e ao acompanhar a entrega. */
export function PickupInfo({ r }: { r?: Req }) {
  if (!r || !("pickup_address" in r)) return null; // contactos.sql ainda não foi corrido
  if (!r.pickup_address && !r.recipient_name) {
    return <div className="notice"><b>Sem local de recolha nem destinatário.</b> Este pedido foi feito antes de os pedirmos. Pede-os a quem envia antes de criar a entrega, para o entregador saber onde pegar a encomenda.</div>;
  }
  const map = mapOk(r.pickup_map);
  return (
    <div className="kv">
      <div><span>Onde pegar a encomenda</span>{r.pickup_address ?? "—"}</div>
      {r.pickup_notes ? <div><span>Horários e referências</span>{r.pickup_notes}</div> : null}
      {map ? <div><span>Localização no mapa</span><a href={map} target="_blank" rel="noopener noreferrer">Abrir no mapa</a></div> : null}
      <div><span>Quem recebe em Angola</span>{r.recipient_name ?? "—"}{r.recipient_phone ? " · " + r.recipient_phone : ""}</div>
      {r.recipient_address ? <div><span>Onde entregar</span>{r.recipient_address}</div> : null}
    </div>
  );
}
