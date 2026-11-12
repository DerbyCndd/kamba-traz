import { createClient } from "./supabase/server";
import { today } from "./format";
import type { Config, ReqPub, TripPub } from "./types";

const DEFAULT_CONFIG: Config = { commission: 12, per_kg: 8000, whatsapp: "" };

export async function getConfig(): Promise<Config> {
  const supabase = await createClient();
  const { data } = await supabase.from("config").select("commission, per_kg, whatsapp").eq("id", 1).maybeSingle();
  return data ? { commission: Number(data.commission), per_kg: data.per_kg, whatsapp: data.whatsapp } : DEFAULT_CONFIG;
}

/** Entradas à espera de verificação. Só devolve valor à equipa (o RLS esconde o resto). */
export async function getPendingCount(): Promise<number> {
  const supabase = await createClient();
  const [a, b] = await Promise.all([
    supabase.from("trips").select("id", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "pendente"),
  ]);
  return (a.count ?? 0) + (b.count ?? 0);
}

/** Viagens abertas e futuras, da mais próxima à mais distante. */
export async function getOpenTrips(from?: string): Promise<TripPub[]> {
  const supabase = await createClient();
  let q = supabase.from("trips_public").select("*").neq("status", "concluida").gte("travel_date", today()).order("travel_date");
  if (from) q = q.eq("origin", from);
  const { data } = await q.limit(200);
  return (data ?? []) as TripPub[];
}

export async function getOpenRequests(from?: string): Promise<ReqPub[]> {
  const supabase = await createClient();
  let q = supabase.from("requests_public").select("*").eq("status", "aberto").order("created_at", { ascending: false });
  if (from) q = q.eq("origin", from);
  const { data } = await q.limit(200);
  return (data ?? []) as ReqPub[];
}
