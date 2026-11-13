import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { today } from "@/lib/format";
import { TripForm } from "./TripForm";

export const metadata: Metadata = { title: "Vou viajar" };

export default async function ViajarPage() {
  const [config, profile] = await Promise.all([getConfig(), getProfile()]);
  const { user, supabase } = await requireUser();
  const hasPhoto = await supabase.from("profiles").select("photo_path").eq("id", user.id).maybeSingle().then((r) => (r.error ? true : !!r.data?.photo_path));
  return (
    <section>
      <h2>Vou viajar</h2>
      <p className="muted">Ganha com o espaço livre na mala.</p>
      {hasPhoto ? null : (
        <p className="notice"><b>Falta a tua foto de perfil.</b> A equipa precisa de te identificar. <Link href="/perfil">Adicionar foto</Link></p>
      )}
      <div className="formgrid">
        <TripForm perKg={config.per_kg} whatsapp={config.whatsapp} defaultName={profile?.full_name ?? ""} minDate={today()} />
      <aside className="aside" aria-label="O que acontece a seguir">
          <h3>O que acontece a seguir</h3>
          <ol className="next">
            <li>A equipa confirma o teu passaporte e o bilhete e fala contigo pelo número que deixaste.</li>
            <li>Depois de aprovada, a viagem aparece no quadro só com o teu primeiro nome.</li>
            <li>Escolhes os pedidos que aceitas. Cada volume é aberto e fotografado junto de quem envia.</li>
          </ol>
          <p className="hint">O pagamento fica retido na carteira e chega-te quando a entrega é confirmada com o código. Vês a entrega em Entregas.</p>
        </aside>
      </div>
    </section>
  );
}
