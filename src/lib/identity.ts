import "server-only";
import type { createClient } from "./supabase/server";

type Supa = Awaited<ReturnType<typeof createClient>>;

export type MyIdentity = {
  full_name: string; phone: string; bi_last4: string; passport_last4: string | null;
  status: "pendente" | "confirmado" | "recusado";
  bi_expiry?: string | null; passport_expiry?: string | null;
};

const BASE = "full_name, phone, bi_last4, passport_last4, status";

/**
 * A identificação da pessoa (feita uma só vez). `available` é falso enquanto o SQL da identificação não foi corrido:
 * nesse caso a app não bloqueia ninguém. `dates` diz se as datas de validade já existem na base (identity-dates.sql).
 */
export async function myIdentity(supabase: Supa, userId: string): Promise<{ available: boolean; dates: boolean; row: MyIdentity | null }> {
  const full = await supabase.from("identities").select(BASE + ", bi_expiry, passport_expiry").eq("user_id", userId).maybeSingle();
  if (!full.error) return { available: true, dates: true, row: (full.data as MyIdentity | null) ?? null };
  const base = await supabase.from("identities").select(BASE).eq("user_id", userId).maybeSingle();
  if (base.error) return { available: false, dates: false, row: null };
  return { available: true, dates: false, row: (base.data as MyIdentity | null) ?? null };
}
