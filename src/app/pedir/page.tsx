import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { myIdentity } from "@/lib/identity";
import { getProfile, requireUser } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { today } from "@/lib/format";
import { RequestForm } from "./RequestForm";

export const metadata: Metadata = { title: "Pedir envio" };

export default async function PedirPage() {
  const [config, profile] = await Promise.all([getConfig(), getProfile()]);
  const { user, supabase } = await requireUser();
  const ident = await myIdentity(supabase, user.id);
  if (ident.available && !ident.row) redirect("/identificacao?next=/pedir");
  return (
    <section>
      <h2>Quero enviar uma encomenda</h2>
      <p className="muted">Demora dois minutos. A equipa verifica e publica.</p>
      <div className="formgrid">
        <RequestForm perKg={config.per_kg} whatsapp={config.whatsapp} defaultName={profile?.full_name ?? ""} defaultPhone={ident.row?.phone ?? ""} minDate={today()} />
      <aside className="aside" aria-label="O que acontece a seguir">
          <h3>O que acontece a seguir</h3>
          <ol className="next">
            <li>A equipa verifica o pedido e fala contigo pelo número que deixaste.</li>
            <li>Depois de aprovado, aparece no quadro só com o teu primeiro nome.</li>
            <li>Quando houver um viajante compatível, combinam o valor e a entrega.</li>
          </ol>
          <p className="hint">O pagamento é combinado com a equipa e fica retido na carteira até a entrega ser confirmada com o código.</p>
        </aside>
      </div>
    </section>
  );
}
