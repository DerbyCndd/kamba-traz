import "server-only";
import type { createClient } from "./supabase/server";
import { decryptPii, idHash } from "./pii";
import type { FamilyContact } from "./safety";

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
export async function myIdentity(supabase: Supa, userId: string): Promise<{ available: boolean; dates: boolean; sides: boolean; safety: boolean | null; selfie: boolean | null; row: MyIdentity | null }> {
  // safety: já deu a morada e os familiares? null se contactos.sql ainda não foi corrido (nesse caso a app não pede nada).
  const sf = await supabase.from("identities").select("address_enc, family_enc").eq("user_id", userId).maybeSingle();
  const safety: boolean | null = sf.error ? null : !!(sf.data?.address_enc && sf.data?.family_enc);
  // selfie: já enviou a selfie a segurar o BI? null se selfie.sql ainda não foi corrido.
  const sl = await supabase.from("identities").select("selfie_path").eq("user_id", userId).maybeSingle();
  const selfie: boolean | null = sl.error ? null : !!sl.data?.selfie_path;
  const sides = (await supabase.from("identities").select("bi_back_path").limit(1)).error === null; // identity-sides.sql corrido?
  const full = await supabase.from("identities").select(BASE + ", bi_expiry, passport_expiry").eq("user_id", userId).maybeSingle();
  if (!full.error) return { available: true, dates: true, sides, safety, selfie, row: (full.data as MyIdentity | null) ?? null };
  const base = await supabase.from("identities").select(BASE).eq("user_id", userId).maybeSingle();
  if (base.error) return { available: false, dates: false, sides: false, safety: null, selfie: null, row: null };
  return { available: true, dates: false, sides, safety, selfie, row: (base.data as MyIdentity | null) ?? null };
}

/**
 * Guarda a «impressão» do BI e do passaporte de uma pessoa, para a equipa ver se o mesmo número aparece noutra conta.
 * Falha em silêncio (por exemplo, se identity-duplicates.sql ainda não foi corrido): a identificação não depende disto.
 */
export async function saveIdHashes(supabase: Supa, userId: string, bi: string, passport: string | null): Promise<boolean> {
  const secret = process.env.RATE_LIMIT_SECRET ?? "";
  const b = idHash("bi", bi);
  if (!secret || !b) return false;
  const { error } = await supabase.rpc("set_identity_hashes", { p_secret: secret, p_user: userId, p_bi: b, p_passport: passport ? idHash("passport", passport) ?? "" : "" });
  return !error;
}

/** Falta a morada e os familiares, ou a selfie com o BI? (false se o SQL correspondente ainda não foi corrido.) */
export const safetyIncomplete = (i: { safety: boolean | null; selfie: boolean | null }) => i.safety === false || i.selfie === false;

export type MySafety = { civil: string | null; address: string | null; family: FamilyContact[] };

/** A minha morada, estado civil e familiares (decifrados aqui, no servidor, e só para o próprio dono). null se ainda não existem ou se contactos.sql não foi corrido. */
export async function getMySafety(supabase: Supa, userId: string): Promise<MySafety | null> {
  const { data, error } = await supabase.from("identities").select("civil_status, address_enc, family_enc").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  const row = data as { civil_status: string | null; address_enc: string | null; family_enc: string | null };
  if (!row.address_enc && !row.family_enc) return null;
  let family: FamilyContact[] = [];
  try { family = row.family_enc ? JSON.parse(decryptPii(row.family_enc) ?? "[]") : []; } catch { family = []; }
  return { civil: row.civil_status, address: row.address_enc ? decryptPii(row.address_enc) : null, family };
}
