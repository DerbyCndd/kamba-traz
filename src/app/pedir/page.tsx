import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { today } from "@/lib/format";
import { RequestForm } from "./RequestForm";

export const metadata: Metadata = { title: "Pedir envio" };

export default async function PedirPage() {
  const [config, profile] = await Promise.all([getConfig(), getProfile()]);
  return (
    <section>
      <h2>Quero enviar uma encomenda</h2>
      <p className="muted">Demora dois minutos. A equipa verifica e publica.</p>
      <div className="formgrid">
        <RequestForm perKg={config.per_kg} whatsapp={config.whatsapp} defaultName={profile?.full_name ?? ""} minDate={today()} />
      <aside className="aside" aria-label="O que acontece a seguir">
          <h3>O que acontece a seguir</h3>
          <ol className="next">
            <li>A equipa verifica o pedido e fala contigo pelo número que deixaste.</li>
            <li>Depois de aprovado, aparece no quadro só com o teu primeiro nome.</li>
            <li>Quando houver um viajante compatível, combinam o valor e a entrega.</li>
          </ol>
          <p className="hint">Ainda não há pagamento em garantia. Combina sempre o pagamento com a equipa antes de enviar.</p>
        </aside>
      </div>
    </section>
  );
}
