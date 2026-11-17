import type { DealContacts as Contacts } from "@/lib/types";
import { waLink } from "@/lib/format";

const mapOk = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

/**
 * Contactos entre as duas partes e dados da recolha, só enquanto o pagamento está retido ou a encomenda está a caminho.
 * O entregador vê onde pegar a encomenda e quem a recebe em Angola. Depois da entrega, isto deixa de aparecer.
 */
export function DealContacts({ c }: { c: Contacts }) {
  const traveler = c.as_role === "traveler";
  const wa = waLink(c.other_phone, `Olá ${c.other_name.split(" ")[0]}, falo-te pela Kamba Traz sobre a entrega.`);
  const map = mapOk(c.pickup_map);
  return (
    <div className="panel">
      <h3>Contactos e recolha</h3>
      <p className="muted">O pagamento está retido na app, por isso já podem falar. {traveler ? "Combina a recolha com quem envia." : "Combina a recolha com o entregador."}</p>
      <div className="kv one">
        <div><span>{traveler ? "Quem envia" : "Entregador"}</span>{c.other_name}</div>
        <div><span>Telefone</span><a href={"tel:" + c.other_phone.replace(/[^\d+]/g, "")}>{c.other_phone}</a>{wa ? <> · <a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></> : null}</div>
        {traveler && c.pickup_address ? <div><span>Onde pegar a encomenda</span>{c.pickup_address}</div> : null}
        {traveler && c.pickup_notes ? <div><span>Horários e referências</span>{c.pickup_notes}</div> : null}
        {traveler && map ? <div><span>Localização no mapa</span><a href={map} target="_blank" rel="noopener noreferrer">Abrir no mapa</a></div> : null}
        {traveler && c.recipient_name ? <div><span>Quem recebe em Angola</span>{c.recipient_name}{c.recipient_phone ? <> · <a href={"tel:" + c.recipient_phone.replace(/[^\d+]/g, "")}>{c.recipient_phone}</a></> : null}</div> : null}
        {traveler && c.recipient_address ? <div><span>Onde entregar</span>{c.recipient_address}</div> : null}
      </div>
      <p className="hint">Fora da app não há pagamento retido, nem código de entrega, nem denúncia à equipa. Nunca paguem nem entreguem nada fora daqui, e só dá o volume a quem tiver o código. Se alguém pedir isso, denuncie.</p>
    </div>
  );
}
