import type { DealContacts as Contacts } from "@/lib/types";
import { waLink } from "@/lib/format";

const mapOk = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);
const tel = (n: string) => "tel:" + n.replace(/[^\d+]/g, "");

/**
 * Contactos entre as duas partes e onde a encomenda muda de mãos, só enquanto o pagamento está retido ou a encomenda está a caminho.
 * Dois caminhos: o entregador vai buscar (vê a morada de quem envia) ou quem envia leva ao entregador (vê a morada onde ele recebe).
 * Depois da entrega, isto deixa de aparecer.
 */
export function DealContacts({ c }: { c: Contacts }) {
  const traveler = c.as_role === "traveler";
  const bring = c.handover === "levar"; // quem envia leva a encomenda ao entregador
  const wa = waLink(c.other_phone, `Olá ${c.other_name.split(" ")[0]}, falo-te pela Kamba Traz sobre a entrega.`);
  const pickupMap = mapOk(c.pickup_map);
  const dropMap = mapOk(c.dropoff_map);
  return (
    <div className="panel">
      <h3>Contactos e recolha</h3>
      <p className="muted">
        O pagamento está retido na app, por isso já podem falar.{" "}
        {bring
          ? (traveler ? "Quem envia vai levar-te a encomenda: combina com ele onde e quando." : "Vais levar a encomenda ao entregador: combina com ele onde e quando.")
          : (traveler ? "Vais buscar a encomenda a quem envia: combina a hora com ele." : "O entregador vai buscar a encomenda: combina a hora com ele.")}
      </p>
      <div className="kv one">
        <div><span>{traveler ? "Quem envia" : "Entregador"}</span>{c.other_name}</div>
        <div><span>Telefone</span><a href={tel(c.other_phone)}>{c.other_phone}</a>{wa ? <> · <a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></> : null}</div>

        {traveler && !bring && c.pickup_address ? <div><span>Onde pegar a encomenda</span>{c.pickup_address}</div> : null}
        {traveler && !bring && !c.pickup_address ? <div><span>Onde pegar a encomenda</span>Não foi indicado neste pedido. Pergunta a quem envia, pelo telefone acima.</div> : null}
        {traveler && !bring && c.pickup_notes ? <div><span>Horários e referências</span>{c.pickup_notes}</div> : null}
        {traveler && !bring && pickupMap ? <div><span>Localização no mapa</span><a href={pickupMap} target="_blank" rel="noopener noreferrer">Abrir no mapa</a></div> : null}

        {!traveler && bring && c.dropoff_address ? <div><span>Onde entregar ao entregador</span>{c.dropoff_address}</div> : null}
        {!traveler && bring && !c.dropoff_address ? <div><span>Onde entregar ao entregador</span>O entregador não indicou onde recebe. Combina com ele pelo telefone acima.</div> : null}
        {!traveler && bring && c.dropoff_notes ? <div><span>Horários e referências</span>{c.dropoff_notes}</div> : null}
        {!traveler && bring && dropMap ? <div><span>Localização no mapa</span><a href={dropMap} target="_blank" rel="noopener noreferrer">Abrir no mapa</a></div> : null}

        {traveler && c.recipient_name ? <div><span>Quem recebe em Angola</span>{c.recipient_name}{c.recipient_phone ? <> · <a href={tel(c.recipient_phone)}>{c.recipient_phone}</a></> : null}</div> : null}
        {traveler && c.recipient_address ? <div><span>Onde entregar</span>{c.recipient_address}</div> : null}
      </div>
      <p className="hint">Fora da app não há pagamento retido, nem código de entrega, nem denúncia à equipa. Nunca paguem nem entreguem nada fora daqui, e só dá o volume a quem tiver o código. Se alguém pedir isso, denuncie.</p>
    </div>
  );
}
