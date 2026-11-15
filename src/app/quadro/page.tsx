import type { Metadata } from "next";
import Link from "next/link";
import { ReqTag, TripPass } from "@/components/Cards";
import { Empty } from "@/components/ui";
import { FROM } from "@/lib/constants";
import { getOpenRequests, getOpenTrips } from "@/lib/data";
import { cityName } from "@/lib/format";

export const metadata: Metadata = { title: "Quadro" };

export default async function QuadroPage({ searchParams }: { searchParams: Promise<{ tab?: string; from?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "pedidos" ? "pedidos" : "viagens";
  const from = FROM.includes(sp.from ?? "") ? sp.from! : "";
  const [trips, reqs] = await Promise.all([getOpenTrips(from), getOpenRequests(from)]);
  const q = (t: string) => `/quadro?tab=${t}${from ? "&from=" + from : ""}`;

  return (
    <section>
      <h2>Quadro de viagens e pedidos</h2>
      <p className="muted">Só aparece o que a equipa já verificou. Os contactos são partilhados depois de haver acordo.</p>

      <form method="get" action="/quadro" className="row" style={{ flexDirection: "row" }}>
        <input type="hidden" name="tab" value={tab} />
        <select name="from" aria-label="Filtrar por origem" defaultValue={from} style={{ maxWidth: 260 }}>
          <option value="">Todas as origens</option>
          {FROM.filter((c) => c !== "OTH").map((c) => <option key={c} value={c}>{cityName(c)} ({c})</option>)}
        </select>
        <button className="btn small" type="submit">Filtrar</button>
      </form>

      <div className="tabs" role="tablist">
        <Link role="tab" aria-selected={tab === "viagens"} href={q("viagens")}>Viagens<span className="cnt">{trips.length}</span></Link>
        <Link role="tab" aria-selected={tab === "pedidos"} href={q("pedidos")}>Pedidos<span className="cnt">{reqs.length}</span></Link>
      </div>

      {tab === "viagens" ? (
        trips.length
          ? <div className="grid">{trips.map((t) => <TripPass key={t.id} t={t} />)}</div>
          : <Empty title="Nenhuma viagem com este filtro" text="Publica a tua viagem e aparece aqui para quem precisa de enviar." cta="Publicar viagem" href="/viajar" />
      ) : (
        reqs.length
          ? <div className="grid tags">{reqs.map((r) => <ReqTag key={r.id} r={r} />)}</div>
          : <Empty title="Nenhum pedido com este filtro" text="Precisas de trazer algo? Faz o teu pedido e os viajantes vêem-no aqui." cta="Pedir envio" href="/pedir" />
      )}
    </section>
  );
}
