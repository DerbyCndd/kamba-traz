import type { Metadata } from "next";
import { myVerification } from "@/lib/identity";
import { missingFor, needsText } from "@/lib/verification";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { routeMatches } from "@/lib/customs";
import { cityName, fdate, kz, today } from "@/lib/format";
import type { ReqPub, TripPub } from "@/lib/types";
import { Empty } from "@/components/ui";
import { NewOfferForm, type Option } from "./NewOfferForm";

export const metadata: Metadata = { title: "Propor valor" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Propor um valor a partir de um pedido (quem viaja) ou de uma viagem (quem envia) do quadro. */
export default async function NovaPropostaPage({ searchParams }: { searchParams: Promise<{ pedido?: string; viagem?: string }> }) {
  const { pedido, viagem } = await searchParams;
  const { user, supabase } = await requireUser();
  const config = await getConfig();

  const back = <p><Link className="link" href="/quadro">← Quadro</Link></p>;
  const fail = (title: string, text: string, cta?: [string, string]) => (
    <section><h2>Propor valor</h2><Empty title={title} text={text} cta={cta?.[0]} href={cta?.[1]} />{back}</section>
  );

  // Quem viaja propõe a um pedido.
  if (pedido && UUID.test(pedido)) {
    const { data } = await supabase.from("requests_public").select("*").eq("id", pedido).maybeSingle();
    const req = data as ReqPub | null;
    if (!req || req.status !== "aberto") return fail("Este pedido já não está aberto", "Escolhe outro no quadro.");
    const own = await supabase.from("requests").select("id").eq("id", pedido).eq("user_id", user.id).maybeSingle();
    const lvl = await myVerification(supabase, user);
    const falta = missingFor("aceitar_pedido", lvl.input);
    if (!own.data && falta.length) return fail("Para levar encomendas precisas do nível 2 de verificação", `Falta: ${needsText(falta)}.`, ["Ver o que falta", "/perfil"]);
    if (own.data) return fail("Este pedido é teu", "Quem viaja é que te propõe um valor. Podes ver as propostas que recebeste.", ["Ver propostas", "/propostas"]);
    const { data: mine } = await supabase.from("trips").select("id, origin, destination, travel_date, kg, per_kg").eq("user_id", user.id).eq("status", "aberto").gte("travel_date", today());
    const trips = ((mine ?? []) as { id: string; origin: string; destination: string; travel_date: string; kg: number; per_kg: number }[]).filter((t) => routeMatches(req, t));
    if (!trips.length) return fail("Não tens uma viagem aberta para esta rota", `Este pedido é de ${cityName(req.origin)} para ${cityName(req.destination)}. Publica a tua viagem (a equipa aprova-a) e volta aqui.`, ["Publicar viagem", "/viajar"]);
    const options: Option[] = trips.map((t) => ({ id: t.id, label: `${cityName(t.origin)} → ${cityName(t.destination)} · ${fdate(t.travel_date)} · ${t.kg} kg livres`, suggest: req.offer }));
    return (
      <section>
        <h2>Propor valor</h2>
        <p className="muted">Pedido de {req.name || "—"}: <b>{req.item || "Encomenda"}</b> · {req.kg}&nbsp;kg · {cityName(req.origin)} → {cityName(req.destination)}. Oferta inicial: {kz(req.offer)}.</p>
        <NewOfferForm mode="traveler" targetId={req.id} options={options} commission={config.commission} />
        {back}
      </section>
    );
  }

  // Quem envia propõe a uma viagem.
  if (viagem && UUID.test(viagem)) {
    const { data } = await supabase.from("trips_public").select("*").eq("id", viagem).maybeSingle();
    const trip = data as TripPub | null;
    if (!trip || trip.status !== "aberto") return fail("Esta viagem já não está aberta", "Escolhe outra no quadro.");
    const own = await supabase.from("trips").select("id").eq("id", viagem).eq("user_id", user.id).maybeSingle();
    if (own.data) return fail("Esta viagem é tua", "Quem envia é que te propõe um valor. Podes ver as propostas que recebeste.", ["Ver propostas", "/propostas"]);
    const { data: mine } = await supabase.from("requests").select("id, origin, destination, item, kg, offer").eq("user_id", user.id).eq("status", "aberto");
    const reqs = ((mine ?? []) as { id: string; origin: string; destination: string; item: string; kg: number; offer: number }[]).filter((r) => routeMatches(r, trip));
    if (!reqs.length) return fail("Não tens um pedido aberto para esta rota", `Esta viagem é de ${cityName(trip.origin)} para ${cityName(trip.destination)}. Faz o teu pedido (a equipa aprova-o) e volta aqui.`, ["Pedir envio", "/pedir"]);
    const options: Option[] = reqs.map((r) => ({ id: r.id, label: `${r.item} · ${r.kg} kg`, suggest: r.offer }));
    return (
      <section>
        <h2>Propor valor</h2>
        <p className="muted">Viagem de {trip.name || "—"}: <b>{cityName(trip.origin)} → {cityName(trip.destination)}</b> · {fdate(trip.travel_date)} · {trip.kg}&nbsp;kg livres · {kz(trip.per_kg)} por kg (referência).</p>
        <NewOfferForm mode="requester" targetId={trip.id} options={options} commission={config.commission} />
        {back}
      </section>
    );
  }

  return fail("Escolhe um pedido ou uma viagem", "No quadro, toca em «Propor valor» no pedido ou na viagem que te interessa.", ["Ver o quadro", "/quadro"]);
}
