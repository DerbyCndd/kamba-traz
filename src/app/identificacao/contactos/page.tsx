import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMySafety, myIdentity, safetyIncomplete } from "@/lib/identity";
import { SafetyForm } from "./SafetyForm";

export const metadata: Metadata = { title: "Segurança da conta" };

const NEXT = new Set(["/", "/pedir", "/viajar", "/perfil"]);

export default async function ContactosPage({ searchParams }: { searchParams: Promise<{ next?: string; editar?: string }> }) {
  const [{ next, editar }, { user, supabase }] = await Promise.all([searchParams, requireUser()]);
  const to = next && NEXT.has(next) ? next : "/";
  const id = await myIdentity(supabase, user.id);
  if (id.available && !id.row) redirect("/identificacao?next=" + encodeURIComponent(to));
  const editing = editar === "1" && id.safety !== null; // atualizar os dados que já existem
  if (!safetyIncomplete(id) && !editing) redirect(to); // nada a pedir (ou o SQL ainda não foi corrido)
  const needBase = id.safety === false || editing, needSelfie = id.selfie === false;
  const initial: Record<string, string> = {};
  if (editing) {
    const cur = await getMySafety(supabase, user.id);
    if (cur) {
      initial.address = cur.address ?? ""; initial.civil = cur.civil ?? "";
      for (const f of cur.family) { initial[f.rel + "_name"] = f.name; initial[f.rel + "_phone"] = f.phone; }
    }
  }
  return (
    <section>
      <h2>Segurança da conta</h2>
      <p className="muted">Pedimos isto uma só vez. Protege quem envia e quem viaja, e ajuda-nos a agir depressa se algo correr mal.</p>
      <div className="formgrid">
        <SafetyForm next={to} needBase={needBase} needSelfie={needSelfie} editing={editing} initial={initial} />
        <aside className="aside" aria-label="Porque pedimos isto">
          <h3>Porque pedimos isto</h3>
          <ol className="next">
            <li>Uma pessoa com morada, família e rosto conhecidos é muito mais difícil de fugir com uma encomenda. Isto protege-te também a ti.</li>
            <li>Só a equipa vê estes dados, e cada abertura fica registada. A morada e os familiares ficam cifrados.</li>
            <li>Só contactamos os familiares em caso de emergência ou de suspeita de fraude.</li>
          </ol>
          <p className="hint">Podes pedir para ver, corrigir ou apagar estes dados, como os outros.</p>
        </aside>
      </div>
    </section>
  );
}
