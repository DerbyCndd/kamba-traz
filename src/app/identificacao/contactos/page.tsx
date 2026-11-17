import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { myIdentity } from "@/lib/identity";
import { SafetyForm } from "./SafetyForm";

export const metadata: Metadata = { title: "Morada e familiares" };

const NEXT = new Set(["/", "/pedir", "/viajar", "/perfil"]);

export default async function ContactosPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { user, supabase }] = await Promise.all([searchParams, requireUser()]);
  const to = next && NEXT.has(next) ? next : "/";
  const id = await myIdentity(supabase, user.id);
  if (id.available && !id.row) redirect("/identificacao?next=" + encodeURIComponent(to));
  if (id.safety === null) redirect(to); // o SQL ainda não foi corrido: nada a pedir
  return (
    <section>
      <h2>Morada e familiares</h2>
      <p className="muted">Pedimos isto uma só vez. Protege quem envia e quem viaja, e ajuda-nos a agir depressa se algo correr mal.</p>
      <div className="formgrid">
        <SafetyForm next={to} />
        <aside className="aside" aria-label="Porque pedimos isto">
          <h3>Porque pedimos isto</h3>
          <ol className="next">
            <li>Uma pessoa com morada e família conhecidas é muito mais difícil de fugir com uma encomenda. Isto protege-te também a ti.</li>
            <li>Só a equipa vê estes dados, cifrados, e cada abertura fica registada.</li>
            <li>Só contactamos os familiares em caso de emergência ou de suspeita de fraude.</li>
          </ol>
          <p className="hint">Podes pedir para ver, corrigir ou apagar estes dados, como os outros.</p>
        </aside>
      </div>
    </section>
  );
}
