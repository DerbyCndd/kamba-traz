"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { myIdentity } from "@/lib/identity";
import { encryptPii, piiReady } from "@/lib/pii";
import type { FamilyContact, FamilyRel } from "@/lib/safety";
import { IMG_MIME, imageKind, uploadFile } from "@/lib/storage-upload";

export type SafetyState = { errors: Record<string, string>; formError?: string; values: Record<string, string> };

const NEXT = new Set(["/", "/pedir", "/viajar", "/perfil"]);
const MAX_PHOTO = 3 * 1024 * 1024;
const clean = (s: unknown) => String(s ?? "").trim();
const phoneOk = (s: string) => /^[0-9+() .-]{9,30}$/.test(s) && s.replace(/\D/g, "").length >= 9;

/**
 * Segurança da conta: morada, estado civil e contactos de familiares (mãe, pai e, se não for solteiro, o cônjuge), e a selfie a segurar o BI.
 * A morada e os familiares ficam cifrados (como o BI); a selfie fica em espaço privado. Só a equipa os abre, e cada abertura fica registada.
 * Pede só o que ainda falta, calculado aqui no servidor.
 */
export async function saveSafety(_: SafetyState, fd: FormData): Promise<SafetyState> {
  const { user, supabase } = await requireUser();
  const id = await myIdentity(supabase, user.id);
  if (id.available && !id.row) redirect("/identificacao");
  const editing = clean(fd.get("editar")) === "1" && id.safety !== null; // atualizar os dados que já existem
  const needBase = id.safety === false || editing, needSelfie = id.selfie === false;
  const next = clean(fd.get("next"));
  const to = NEXT.has(next) ? next : "/";
  if (!needBase && !needSelfie) redirect(to);

  const v: Record<string, string> = {};
  fd.forEach((x, k) => { if (typeof x === "string") v[k] = x.trim(); });
  const errors: Record<string, string> = {};

  const address = clean(v.address).replace(/\s+/g, " ");
  const civil = clean(v.civil);
  const family: FamilyContact[] = [];
  if (needBase) {
    if (address.length < 10 || address.length > 300) errors.address = "Escreve a morada completa: rua, número, bairro e cidade.";
    if (!["solteiro", "casado", "outro"].includes(civil)) errors.civil = "Escolhe o teu estado civil.";
    const rels: FamilyRel[] = ["mae", "pai", "conjuge"];
    for (const rel of rels) {
      const name = clean(v[rel + "_name"]).replace(/\s+/g, " "), phone = clean(v[rel + "_phone"]);
      if (!name && !phone) continue;
      if (name.length < 2 || name.length > 80) { errors[rel + "_name"] = "Escreve o nome."; continue; }
      if (!phoneOk(phone)) { errors[rel + "_phone"] = "Indica um número com indicativo, por exemplo +244 923 000 000."; continue; }
      family.push({ rel, name, phone });
    }
    if (civil === "casado" && !family.some((f) => f.rel === "conjuge") && !errors.conjuge_name && !errors.conjuge_phone) {
      errors.conjuge_name = "Indica o contacto do teu cônjuge.";
    }
    if (!family.length && !Object.keys(errors).some((k) => k.endsWith("_name") || k.endsWith("_phone"))) {
      errors.mae_name = "Indica pelo menos um familiar: a mãe, o pai ou o cônjuge.";
    }
    if (clean(v.ok) !== "on") errors.ok = "Tens de confirmar para continuar.";
  }

  let selfie: { bytes: Uint8Array; kind: keyof typeof IMG_MIME } | null = null;
  if (needSelfie) {
    const f = fd.get("selfie");
    if (!(f instanceof File) || f.size === 0) errors.selfie = "Junta a selfie a segurar o teu BI.";
    else if (f.size > MAX_PHOTO) errors.selfie = "A foto é demasiado grande (máximo 3 MB).";
    else {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const kind = imageKind(bytes);
      if (!kind) errors.selfie = "Usa uma foto em JPG, PNG ou WebP.";
      else selfie = { bytes, kind };
    }
  }
  if (Object.keys(errors).length) return { errors, values: v };
  if (needBase && !piiReady()) return { errors: {}, values: v, formError: "De momento não conseguimos guardar estes dados em segurança. Fala com a equipa." };

  let selfiePath: string | null = null;
  if (selfie) {
    const path = `${user.id}/selfie-${crypto.randomUUID()}.${selfie.kind}`;
    const up = await uploadFile(supabase, "ids", path, selfie.bytes, IMG_MIME[selfie.kind]);
    if (!up.ok) return { errors: {}, values: v, formError: `Não foi possível enviar a selfie agora. Tenta de novo daqui a pouco. (Motivo técnico: ${up.reason})` };
    selfiePath = path;
  }

  const patch: Record<string, string> = {};
  if (needBase) Object.assign(patch, { civil_status: civil, address_enc: encryptPii(address), family_enc: encryptPii(JSON.stringify(family)) });
  if (selfiePath) patch.selfie_path = selfiePath;
  const { data, error } = await supabase.from("identities").update(patch).eq("user_id", user.id).select("user_id");
  if (error || !data?.length) {
    if (selfiePath) await supabase.storage.from("ids").remove([selfiePath]); // não deixa a selfie órfã
    return { errors: {}, values: v, formError: "Não foi possível guardar agora. Tenta de novo daqui a pouco." };
  }

  revalidatePath("/", "layout");
  redirect(to);
}
