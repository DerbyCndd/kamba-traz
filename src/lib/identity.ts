import "server-only";
import type { createClient } from "./supabase/server";

type Supa = Awaited<ReturnType<typeof createClient>>;

export type MyIdentity = {
  full_name: string; phone: string; bi_last4: string; passport_last4: string | null;
  status: "pendente" | "confirmado" | "recusado";
};

/**
 * A identificação da pessoa (feita uma só vez). `available` é falso enquanto o SQL da identificação não foi corrido:
 * nesse caso a app não bloqueia ninguém.
 */
export async function myIdentity(supabase: Supa, userId: string): Promise<{ available: boolean; row: MyIdentity | null }> {
  const r = await supabase.from("identities").select("full_name, phone, bi_last4, passport_last4, status").eq("user_id", userId).maybeSingle();
  if (r.error) return { available: false, row: null };
  return { available: true, row: (r.data as MyIdentity | null) ?? null };
}
