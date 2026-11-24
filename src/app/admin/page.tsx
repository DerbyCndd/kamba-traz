import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAgreements, getConfig, getNewAccountLimitSetting, getWaiverHolders } from "@/lib/data";
import { kz, today } from "@/lib/format";
import { teamSuggestions } from "@/lib/match-data";
import type { Deal, DealReport, FeedbackRow, IdentityView, Req, TravelerDocView, Trip } from "@/lib/types";
import { Entradas } from "./tabs/Entradas";
import { Entregas } from "./tabs/Entregas";
import { Quadro } from "./tabs/Quadro";
import { Analise } from "./tabs/Analise";
import { Economia } from "./tabs/Economia";
import { Pitch } from "./tabs/Pitch";
import { FeedbackTab } from "./tabs/FeedbackTab";
import { Denuncias } from "./tabs/Denuncias";
import { Definicoes } from "./tabs/Definicoes";
import { CheckIdentities } from "./tabs/CheckIdentities";
import { Identificacoes } from "./tabs/Identificacoes";
import { EquipaTab, type AccessRow, type TeamMember, type TwoFa } from "./tabs/EquipaTab";
import { ACCESS_LABEL } from "@/lib/audit";

export const metadata: Metadata = { title: "Equipa" };

const TABS = [["entradas", "Por verificar"], ["ligacoes", "Entregas"], ["quadro", "Quadro"], ["analise", "Análise"], ["economia", "Economia"], ["pitch", "Pitch"], ["denuncias", "Denúncias"], ["feedback", "Feedback"], ["definicoes", "Definições"]] as const;

type Supa = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Identificações para a equipa. Tenta com as colunas mais recentes e recua se a base ainda não as tem. */
async function loadIdentityRows(supabase: Supa): Promise<IdentityView[]> {
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

/** Junta a cada identificação quem partilha o mesmo número de BI ou de passaporte (só se identity-duplicates.sql já foi corrido). */
async function loadIdentities(supabase: Supa): Promise<IdentityView[]> {
  const rows = await loadIdentityRows(supabase);
  const { data, error } = await supabase.rpc("identity_duplicates");
  if (error || !data) return rows;
  const by = new Map<string, { kind: "bi" | "passport"; name: string }[]>();
  for (const d of data as { user_id: string; kind: "bi" | "passport"; other_name: string }[]) {
    by.set(d.user_id, [...(by.get(d.user_id) ?? []), { kind: d.kind, name: d.other_name }]);
  }
  return rows.map((r) => (by.has(r.user_id) ? { ...r, dups: by.get(r.user_id) } : r));
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { supabase } = await requireAdmin();
  const { tab: raw } = await searchParams;
  const owner = await supabase.rpc("is_owner").then((r) => (r.error ? false : r.data === true)); // só o dono vê «Equipa» (equipa.sql)
  const tabs: readonly (readonly [string, string])[] = owner ? [...TABS, ["equipa", "Equipa"] as const] : TABS;
  const tab = tabs.some((t) => t[0] === raw) ? raw! : "entradas";
  // 2FA da equipa e registo de acessos (só o dono; precisam de seguranca-equipa.sql)
  const flag = owner ? await supabase.from("config").select("staff_2fa").eq("id", 1).maybeSingle() : null;
  const twofa: TwoFa = {
    available: !!flag && !flag.error, on: flag?.data?.staff_2fa === true,
    mine: owner ? (await supabase.auth.mfa.getAuthenticatorAssuranceLevel()).data?.currentLevel === "aal2" : false,
  };
  let log: AccessRow[] | null = null;
  if (owner) {
    const raw = await supabase.from("access_log").select("id, at, staff_id, action, subject_id, detail").order("at", { ascending: false }).limit(100);
    if (!raw.error) {
      const rows = (raw.data ?? []) as { id: number; at: string; staff_id: string | null; action: string; subject_id: string | null; detail: string | null }[];
      const ids = [...new Set(rows.flatMap((r) => [r.staff_id, r.subject_id]).filter((x): x is string => !!x))];
      const names: Record<string, string> = ids.length
        ? Object.fromEntries(((await supabase.from("profiles").select("id, full_name").in("id", ids)).data ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name || "Sem nome"]))
        : {};
      log = rows.map((r) => ({ id: r.id, at: r.at, staff: r.staff_id ? names[r.staff_id] ?? "Conta removida" : "Conta removida", what: ACCESS_LABEL[r.action] ?? r.action, subject: r.subject_id ? names[r.subject_id] ?? null : null, detail: r.detail }));
    }
  }
  const members: TeamMember[] = owner ? await supabase.rpc("team_list").then((r) => (r.error ? [] : (r.data ?? [])) as TeamMember[]) : [];

  const [config, holders, docs, feedback, trips, reqs, deals, idents, agreements, unchecked, reports] = await Promise.all([
    getConfig(),
    getWaiverHolders(),
    supabase.from("traveler_docs").select("trip_id, full_name, passport_last4, outbound_date, return_date, status, created_at").then((r) => (r.data ?? []) as TravelerDocView[]),
    supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(100).then((r) => (r.data ?? []) as FeedbackRow[]),
    supabase.from("trips").select("*").order("created_at", { ascending: false }).then((r) => (r.data ?? []) as Trip[]),
    supabase.from("requests").select("*").order("created_at", { ascending: false }).then((r) => (r.data ?? []) as Req[]),
    supabase.from("deals").select("*").order("created_at", { ascending: false }).then((r) => (r.data ?? []) as Deal[]),
    loadIdentities(supabase),
    getAgreements(),
    supabase.rpc("identity_unchecked").then((r) => (r.error ? 0 : Number(r.data) || 0)),
    supabase.from("deal_reports").select("*").order("created_at", { ascending: false }).limit(100).then((r) => (r.error ? [] : (r.data ?? [])) as DealReport[]),
  ]);
  const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
  const reporterNames: Record<string, string> = reporterIds.length
    ? Object.fromEntries(((await supabase.from("profiles").select("id, full_name").in("id", reporterIds)).data ?? []).map((p: { id: string; full_name: string | null }) => [p.id, (p.full_name ?? "").split(" ")[0]]))
    : {};

  const newLimit = await getNewAccountLimitSetting();
  // Sugestões de emparelhamento, só no separador Quadro (as avaliações vêm da vista pública das viagens)
  const matchSugg = tab === "quadro"
    ? teamSuggestions(reqs, trips, deals, await supabase.from("trips_public").select("id, rating, rating_count").then((r) => new Map(((r.data ?? []) as { id: string; rating: number | null; rating_count: number }[]).map((x) => [x.id, x]))), today())
    : [];
  const itemUsers = new Set([...trips.filter((t) => t.status === "pendente").map((t) => t.user_id), ...reqs.filter((r) => r.status === "pendente").map((r) => r.user_id)]);
  const looseIdents = idents.filter((i) => i.status === "pendente" && !itemUsers.has(i.user_id)); // enviaram o BI mas ainda não têm viagem nem pedido por aprovar
  const pending = trips.filter((t) => t.status === "pendente").length + reqs.filter((r) => r.status === "pendente").length + looseIdents.length;
  const active = deals.filter((d) => d.status !== "liberado" && d.status !== "cancelado");
  const held = deals.filter((d) => ["garantia", "recolhido", "transito", "entregue"].includes(d.status)).reduce((a, d) => a + d.price, 0);
  const earned = deals.filter((d) => d.status === "liberado").reduce((a, d) => a + d.commission, 0);
  const pipeline = active.reduce((a, d) => a + d.commission, 0);
  const counts: Record<string, number> = { entradas: pending, ligacoes: deals.length + agreements.length, quadro: trips.length + reqs.length - (pending - looseIdents.length), feedback: feedback.filter((f) => f.status === "novo").length, denuncias: reports.filter((r) => r.status !== "resolvida").length };

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
        {tabs.map(([k, t]) => (
          <Link key={k} role="tab" aria-selected={tab === k} href={`/admin?tab=${k}`}>
            {t}{k in counts ? <span className="cnt">{counts[k]}</span> : null}
          </Link>
        ))}
      </div>
      {tab === "entradas" && <CheckIdentities unchecked={unchecked} />}
      {tab === "entradas" && <Identificacoes idents={looseIdents} />}
      {tab === "entradas" && <Entradas trips={trips} reqs={reqs} deals={deals} config={config} docs={docs} idents={idents} otherPending={looseIdents.length} />}
      {tab === "ligacoes" && <Entregas trips={trips} reqs={reqs} deals={deals} commission={config.commission} holders={holders} agreements={agreements} />}
      {tab === "quadro" && <Quadro trips={trips} reqs={reqs} suggestions={matchSugg} />}
      {tab === "analise" && <Analise trips={trips} reqs={reqs} deals={deals} />}
      {tab === "economia" && <Economia perKg={config.per_kg} commission={config.commission} />}
      {tab === "pitch" && <Pitch />}
      {tab === "denuncias" && <Denuncias rows={reports} names={reporterNames} />}
      {tab === "feedback" && <FeedbackTab rows={feedback} />}
      {tab === "equipa" && owner && <EquipaTab members={members} twofa={twofa} log={log} />}
      {tab === "definicoes" && <Definicoes config={config} newLimit={newLimit} />}
    </section>
  );
}
