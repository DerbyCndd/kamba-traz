import type { Metadata } from "next";
import { getProfile, requireUser } from "@/lib/auth";
import { myIdentity } from "@/lib/identity";
import { IdentityForm } from "./IdentityForm";

export const metadata: Metadata = { title: "Identificação" };

const NEXT = new Set(["/", "/pedir", "/viajar", "/perfil"]);

export default async function IdentificacaoPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { user, supabase }, profile] = await Promise.all([searchParams, requireUser(), getProfile()]);
  const id = await myIdentity(supabase, user.id);
  const to = next && NEXT.has(next) ? next : "/";
  return (
    <section>
      <h2>Identificação</h2>
      <p className="muted">
        Pedimos isto uma só vez. Fica guardado e serve para pedir envios e para viajar, sem repetir.
        {id.row ? " Já tens a identificação guardada: enviar de novo substitui a anterior." : ""}
      </p>
      {!id.available ? <div className="notice bad" role="alert">A identificação ainda não está ativa. Fala com a equipa.</div> : null}
      <div className="formgrid">
        <IdentityForm defaultName={id.row?.full_name ?? profile?.full_name ?? ""} defaultPhone={id.row?.phone ?? ""} next={to} hasIdentity={!!id.row} dates={id.dates} />
        <aside className="aside" aria-label="Porque pedimos isto">
          <h3>Porque pedimos isto</h3>
          <ol className="next">
            <li>Para saber quem entrega e quem envia, e proteger as duas partes.</li>
            <li>Só o BI e o telefone são obrigatórios. O passaporte é opcional. Conferimos as validades dos documentos.</li>
            <li>Os números ficam cifrados e as fotos em espaço privado. Só a equipa os vê.</li>
          </ol>
          <p className="hint">Se mudares de documento mais tarde, podes atualizar em Meu perfil.</p>
        </aside>
      </div>
    </section>
  );
}
