import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAgreements, getConfig, getWaiverHolders } from "@/lib/data";
import { kz } from "@/lib/format";
import type { Deal, FeedbackRow, IdentityView, Req, TravelerDocView, Trip } from "@/lib/types";
import { Entradas } from "./tabs/Entradas";
import { Entregas } from "./tabs/Entregas";
import { Quadro } from "./tabs/Quadro";
import { Analise } from "./tabs/Analise";
import { Economia } from "./tabs/Economia";
import { Pitch } from "./tabs/Pitch";
import { FeedbackTab } from "./tabs/FeedbackTab";
import { Definicoes } from "./tabs/Definicoes";

export const metadata: Metadata = { title: "Equipa" };

const TABS = [["entradas", "Por verificar"], ["ligacoes", "Entregas"], ["quadro", "Quadro"], ["analise", "Análise"], ["economia", "Economia"], ["pitch", "Pitch"], ["feedback", "Feedback"], ["definicoes", "Definições"]] as const;

type Supa = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Identificações para a equipa. Tenta com as colunas mais recentes e recua se a base ainda não as tem. */
async function loadIdentities(supabase: Supa): Promise<IdentityView[]> {
  const base = "user_id, full_name, phone, bi_last4, passport_last4, status";
  const a = await supabase.from("identities").select(base + ", bi_expiry, passport_expiry, bi_back_path, passport_last_path");
  if (!a.error) {
    return ((a.data ?? []) as unknown as Record<string, unknown>[]).map((r) => { const { bi_back_path, passport_last_path, ...rest } = r; return { ...rest, has_bi_back: !!bi_back_path, has_passport_last: !!passport_last_path } as unknown as IdentityView; });
  }
  const b = await supabase.from("identities").select(base + ", bi_expiry, passport_expiry");
  if (!b.error) return (b.data ?? []) as unknown as IdentityView[];
  const c = await supabase.from("identities").select(base);
  return (c.data ?? []) as unknown as IdentityView[];
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { supabase } = await requireAdmin();
  const { tab: raw } = await searchParams;
  const tab = TABS.some((t) => t[0] === raw) ? raw! : "entradas";

  const [config, holders, docs, feedback, trips, reqs, deals, idents, agreements] = await Promise.all([
    getConfig(),
    getWaiverHolders(),
    supabase.from("traveler_docs").select("trip_id, full_name, passport_last4, outbound_date, return_date, status, created_at").then((r) => (r.data ?? []) as TravelerDocView[]),
    supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(100).then((r) => (r.data ?? []) as FeedbackRow[]),
    supabase.from("trips").select("*").order("created_at", { ascending: false }).then((r) => (r.data ?? []) as Trip[]),
    supabase.from("requests").select("*").order("created_at", { ascending: false }).then((r) => (r.data ?? []) as Req[]),
    supabase.from("deals").select("*").order("created_at", { ascending: false }).then((r) => (r.data ?? []) as Deal[]),
    loadIdentities(supabase),
    getAgreements(),
  ]);

  const pending = trips.filter((t) => t.status === "pendente").length + reqs.filter((r) => r.status === "pendente").length;
  const active = deals.filter((d) => d.status !== "liberado" && d.status !== "cancelado");
  const held = deals.filter((d) => ["garantia", "transito", "entregue"].includes(d.status)).reduce((a, d) => a + d.price, 0);
  const earned = deals.filter((d) => d.status === "liberado").reduce((a, d) => a + d.commission, 0);
  const pipeline = active.reduce((a, d) => a + d.commission, 0);
  const counts: Record<string, number> = { entradas: pending, ligacoes: deals.length + agreements.length, quadro: trips.length + reqs.length - pending, feedback: feedback.filter((f) => f.status === "novo").length };

  return (
    <section>
      <h2>Painel da equipa</h2>
      <div className="stats">
        <div><span className="label">Por verificar</span><b>{pending}</b></div>
        <div><span className="label">Entregas em curso</span><b>{active.length}</b></div>
        <div><span className="label">Em garantia</span><b>{kz(held)}</b></div>
        <div><span className="label">Comissão a receber</span><b>{kz(pipeline)}</b></div>
        <div><span className="label">Comissão recebida</span><b>{kz(earned)}</b></div>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, t]) => (
          <Link key={k} role="tab" aria-selected={tab === k} href={`/admin?tab=${k}`}>
            {t}{k in counts ? <span className="cnt">{counts[k]}</span> : null}
          </Link>
        ))}
      </div>
      {tab === "entradas" && <Entradas trips={trips} reqs={reqs} deals={deals} config={config} docs={docs} idents={idents} />}
      {tab === "ligacoes" && <Entregas trips={trips} reqs={reqs} deals={deals} commission={config.commission} holders={holders} agreements={agreements} />}
      {tab === "quadro" && <Quadro trips={trips} reqs={reqs} />}
      {tab === "analise" && <Analise trips={trips} reqs={reqs} deals={deals} />}
      {tab === "economia" && <Economia perKg={config.per_kg} commission={config.commission} />}
      {tab === "pitch" && <Pitch />}
      {tab === "feedback" && <FeedbackTab rows={feedback} />}
      {tab === "definicoes" && <Definicoes config={config} />}
    </section>
  );
}
