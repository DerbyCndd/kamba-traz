"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { encryptPii, piiReady } from "@/lib/pii";
import type { FamilyContact, FamilyRel } from "@/lib/safety";

export type SafetyState = { errors: Record<string, string>; formError?: string; values: Record<string, string> };

const NEXT = new Set(["/", "/pedir", "/viajar", "/perfil"]);
const clean = (s: unknown) => String(s ?? "").trim();
const phoneOk = (s: string) => /^[0-9+() .-]{9,30}$/.test(s) && s.replace(/\D/g, "").length >= 9;

/**
 * Morada, estado civil e contactos de familiares (mãe, pai e, se não for solteiro, o cônjuge).
 * Ficam cifrados (como o BI) e só a equipa os abre, em caso de emergência ou de suspeita de fraude.
 */
export async function saveSafety(_: SafetyState, fd: FormData): Promise<SafetyState> {
  const { user, supabase } = await requireUser();
  const v: Record<string, string> = {};
  fd.forEach((x, k) => { if (typeof x === "string") v[k] = x.trim(); });
  const errors: Record<string, string> = {};

  const address = clean(v.address).replace(/\s+/g, " ");
  const civil = clean(v.civil);
  if (address.length < 10 || address.length > 300) errors.address = "Escreve a morada completa: rua, número, bairro e cidade.";
  if (!["solteiro", "casado", "outro"].includes(civil)) errors.civil = "Escolhe o teu estado civil.";

  const family: FamilyContact[] = [];
  const rels: [FamilyRel, string][] = [["mae", "mae"], ["pai", "pai"], ["conjuge", "conjuge"]];
  for (const [rel, key] of rels) {
    const name = clean(v[key + "_name"]).replace(/\s+/g, " "), phone = clean(v[key + "_phone"]);
    if (!name && !phone) continue;
    if (name.length < 2 || name.length > 80) { errors[key + "_name"] = "Escreve o nome."; continue; }
    if (!phoneOk(phone)) { errors[key + "_phone"] = "Indica um número com indicativo, por exemplo +244 923 000 000."; continue; }
    family.push({ rel, name, phone });
  }
  if (civil === "casado" && !family.some((f) => f.rel === "conjuge") && !errors.conjuge_name && !errors.conjuge_phone) {
    errors.conjuge_name = "Indica o contacto do teu cônjuge.";
  }
  if (!family.length && !Object.keys(errors).some((k) => k.endsWith("_name") || k.endsWith("_phone"))) {
    errors.mae_name = "Indica pelo menos um familiar: a mãe, o pai ou o cônjuge.";
  }
  if (clean(v.ok) !== "on") errors.ok = "Tens de confirmar para continuar.";
  if (Object.keys(errors).length) return { errors, values: v };

  if (!piiReady()) return { errors: {}, values: v, formError: "De momento não conseguimos guardar estes dados em segurança. Fala com a equipa." };

  const { data, error } = await supabase.from("identities").update({
    civil_status: civil, address_enc: encryptPii(address), family_enc: encryptPii(JSON.stringify(family)),
  }).eq("user_id", user.id).select("user_id");
  if (error) return { errors: {}, values: v, formError: "Não foi possível guardar agora. Tenta de novo daqui a pouco." };
  if (!data?.length) redirect("/identificacao"); // ainda não fez a identificação

  revalidatePath("/", "layout");
  const next = clean(v.next);
  redirect(NEXT.has(next) ? next : "/");
}
