import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { cityName, fdate, refCode } from "@/lib/format";

export const metadata: Metadata = { title: "Os meus" };

type Mine = { id: string; kind: "trip" | "request"; title: string; status: string; created_at: string };

export default async function MeusPage() {
  const { user, supabase } = await requireUser();
  const [t, r] = await Promise.all([
    supabase.from("trips").select("id, origin, destination, travel_date, status, created_at").eq("user_id", user.id),
    supabase.from("requests").select("id, item, status, created_at").eq("user_id", user.id),
  ]);
  const items: Mine[] = [
    ...(t.data ?? []).map((x) => ({ id: x.id, kind: "trip" as const, title: `${cityName(x.origin)} para ${cityName(x.destination)}, ${fdate(x.travel_date)}`, status: x.status, created_at: x.created_at })),
    ...(r.data ?? []).map((x) => ({ id: x.id, kind: "request" as const, title: x.item as string, status: x.status, created_at: x.created_at })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const pill = (s: string): [string, string] =>
    s === "pendente" ? ["warn", "EM VERIFICAÇÃO"] : s === "recusado" ? ["bad", "RECUSADO"] : ["ok", "PUBLICADO"];
  const note = (s: string) =>
    s === "pendente" ? "A equipa vai contactar-te pelo número que indicaste. Se nada acontecer em dois dias, escreve-nos por WhatsApp."
    : s === "recusado" ? "A equipa não pôde aprovar esta entrada. Contacta-nos por WhatsApp se quiseres saber mais."
    : "Já aparece no quadro. A equipa fala contigo quando houver um interessado.";

  return (
    <section>
      <h2>Os meus pedidos e viagens</h2>
      <p className="muted">Aqui vês o estado de tudo o que enviaste nesta conta.</p>
      <div className="row">
        <Link className="btn small primary" href="/pedir">Novo pedido</Link>
        <Link className="btn small" href="/viajar">Nova viagem</Link>
      </div>
      {items.length ? (
        <div className="list">
          {items.map((it) => {
            const [cls, text] = pill(it.status);
            return (
              <article className="item" key={it.id}>
                <div className="head">
                  <div>
                    <span className="label">{it.kind === "trip" ? "Viagem" : "Pedido"} KT-{refCode(it.id)}</span>
                    <h3>{it.title}</h3>
                  </div>
                  <span className={"pill " + cls}>{text}</span>
                </div>
                <p className="hint">{note(it.status)}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty title="Ainda não enviaste nada" text="Quando enviares um pedido ou uma viagem, acompanhas o estado aqui." cta="Pedir envio" href="/pedir" />
      )}
    </section>
  );
}
