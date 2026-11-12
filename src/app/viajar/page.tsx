import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { today } from "@/lib/format";
import { TripForm } from "./TripForm";

export const metadata: Metadata = { title: "Vou viajar" };

export default async function ViajarPage() {
  const [config, profile] = await Promise.all([getConfig(), getProfile()]);
  return (
    <section>
      <h2>Vou viajar e tenho espaço na mala</h2>
      <p className="muted">Ganhas dinheiro com o espaço que já tens. Tu defines o preço por kg e escolhes os pedidos que aceitas.</p>
      <div className="formgrid">
        <TripForm perKg={config.per_kg} whatsapp={config.whatsapp} defaultName={profile?.full_name ?? ""} minDate={today()} />
        <aside className="panel flat aside" aria-label="O que acontece a seguir">
          <h3>O que acontece a seguir</h3>
          <ol className="next">
            <li>A equipa verifica a viagem e fala contigo pelo número que deixaste.</li>
            <li>Depois de aprovada, aparece no quadro só com o teu primeiro nome.</li>
            <li>Escolhes os pedidos que aceitas. Cada volume é aberto e fotografado junto de quem envia.</li>
          </ol>
          <p className="hint">Ainda não há pagamento em garantia. Combina sempre o pagamento com a equipa antes de aceitar um pedido.</p>
        </aside>
      </div>
    </section>
  );
}
