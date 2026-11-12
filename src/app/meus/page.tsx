import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/ui";
import { RateForm } from "@/components/RateForm";
import { getPendingRatings } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { cityName, fdate, refCode } from "@/lib/format";

export const metadata: Metadata = { title: "Os meus" };

type Mine = { id: string; kind: "trip" | "request"; title: string; status: string; created_at: string; docs?: string };
const DOCS: Record<string, string> = { pendente: "Documentos enviados, à espera de confirmação da equipa.", confirmado: "Documentos confirmados pela equipa.", recusado: "A equipa não conseguiu confirmar os documentos. Fala com ela por WhatsApp." };

export default async function MeusPage() {
  const { user, supabase } = await requireUser();
  const toRate = await getPendingRatings();
  const { data: docRows } = await supabase.from("traveler_docs").select("trip_id, status").eq("user_id", user.id);
  const docOf = new Map((docRows ?? []).map((d) => [d.trip_id as string, d.status as string]));
  const [t, r] = await Promise.all([
    supabase.from("trips").select("id, origin, destination, travel_date, status, created_at").eq("user_id", user.id),
    supabase.from("requests").select("id, item, status, created_at").eq("user_id", user.id),
  ]);
  const items: Mine[] = [
    ...(t.data ?? []).map((x) => ({ id: x.id, kind: "trip" as const, title: `${cityName(x.origin)} para ${cityName(x.destination)}, ${fdate(x.travel_date)}`, status: x.status, created_at: x.created_at, docs: docOf.get(x.id) })),
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
      {toRate.length ? (
        <div className="torate">
          <h3>Por avaliar ({toRate.length})</h3>
          <p className="hint">As entregas já concluídas. A tua avaliação ajuda a escolher os melhores.</p>
          {toRate.map((p) => (
            <article className="item" key={p.deal_id}>
              <div className="head">
                <div><span className="label">{p.ratee_role === "traveler" ? "Avalias o entregador" : "Avalias o remetente"}</span><h3>{p.label}</h3></div>
                <span className="pill ok">ENTREGUE</span>
              </div>
              <RateForm p={p} />
            </article>
          ))}
        </div>
      ) : null}
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
                {it.kind === "trip" && it.docs ? <p className="hint">{DOCS[it.docs]}</p> : null}
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
