import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { myIdentity, safetyIncomplete } from "@/lib/identity";
import { getProfile, requireUser } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { today } from "@/lib/format";
import { TripForm } from "./TripForm";

export const metadata: Metadata = { title: "Vou viajar" };

export default async function ViajarPage() {
  const [config, profile] = await Promise.all([getConfig(), getProfile()]);
  const { user, supabase } = await requireUser();
  const ident = await myIdentity(supabase, user.id);
  if (ident.available && !ident.row) redirect("/identificacao?next=/viajar");
  if (ident.row && safetyIncomplete(ident)) redirect("/identificacao/contactos?next=/viajar");
  const hasPhoto = await supabase.from("profiles").select("photo_path").eq("id", user.id).maybeSingle().then((r) => (r.error ? true : !!r.data?.photo_path));
  const dropoff = (await supabase.from("trips").select("dropoff_address").limit(1)).error === null; // entrega-local.sql corrido?
  const needsPassport = !!ident.row && !ident.row.passport_last4; // só se envia a viagem com o passaporte já registado
  return (
    <section>
      <h2>Vou viajar</h2>
      <p className="muted">Ganha com o espaço livre na mala.</p>
      {hasPhoto ? null : (
        <p className="notice"><b>Falta a tua foto de perfil.</b> A equipa precisa de te identificar. <Link href="/perfil">Adicionar foto</Link></p>
      )}
      {needsPassport ? (
        <div className="notice bad" role="alert">
          <b>Falta registar o teu passaporte.</b> Quem viaja tem de ter o passaporte registado (número, validade e as fotos da 2.ª e da última página), para a equipa o conferir com o teu bilhete. Para só enviar encomendas não é preciso.{" "}
          <Link className="btn small primary" href="/identificacao?next=/viajar&passaporte=1">Registar o passaporte</Link>
        </div>
      ) : null}
      <div className="formgrid">
        {needsPassport ? <div className="panel"><p className="muted">O formulário da viagem abre depois de registares o passaporte.</p></div> : <TripForm perKg={config.per_kg} whatsapp={config.whatsapp} defaultName={profile?.full_name ?? ""} defaultPhone={ident.row?.phone ?? ""} minDate={today()} dropoff={dropoff} />}
      <aside className="aside" aria-label="O que acontece a seguir">
          <h3>O que acontece a seguir</h3>
          <ol className="next">
            <li>A equipa confirma o teu bilhete e a tua identificação, que já deixaste, e fala contigo pelo número que indicaste.</li>
            <li>Depois de aprovada, a viagem aparece no quadro só com o teu primeiro nome.</li>
            <li>Escolhes os pedidos e propões um valor na página Propostas. Cada volume é aberto e fotografado junto de quem envia.</li>
          </ol>
          <p className="hint">O pagamento fica retido na carteira e chega-te quando a entrega é confirmada com o código. Vês a entrega em Entregas.</p>
        </aside>
      </div>
    </section>
  );
}
