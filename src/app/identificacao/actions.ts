"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";
import { uploadFile } from "@/lib/storage-upload";
import { expiryError } from "@/lib/docchecks";
import { today } from "@/lib/format";
import { myIdentity, saveIdHashes } from "@/lib/identity";
import { encryptPii, piiReady } from "@/lib/pii";
import { isLimited, recordHit, TOO_MANY } from "@/lib/ratelimit";

export type IdentityState = { errors: Record<string, string>; formError?: string; values: Record<string, string> };

const MAX = 3 * 1024 * 1024;
const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
const NEXT = new Set(["/", "/pedir", "/viajar", "/perfil"]);

/** Confirma pelo conteúdo (não pelo nome nem pelo tipo declarado) que o ficheiro é mesmo uma imagem aceite. */
function imageKind(b: Uint8Array): keyof typeof MIME | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
}
const clean = (s: unknown) => String(s ?? "").trim();
const phoneOk = (s: string) => s.replace(/\D/g, "").length >= 9 && s.length <= 30;

async function readPhoto(fd: FormData, key: string, label: string, errors: Record<string, string>, required: boolean) {
  const f = fd.get(key);
  if (!(f instanceof File) || f.size === 0) { if (required) errors[key] = `Junta a foto ${label}.`; return null; }
  if (f.size > MAX) { errors[key] = "A foto é demasiado grande (máximo 3 MB)."; return null; }
  const bytes = new Uint8Array(await f.arrayBuffer());
  const kind = imageKind(bytes);
  if (!kind) { errors[key] = "Usa uma foto em JPG, PNG ou WebP."; return null; }
  return { bytes, kind };
}

/** Guarda a identificação (BI + telefone; passaporte opcional). Os números nunca voltam ao browser. */
export async function saveIdentity(_: IdentityState, fd: FormData): Promise<IdentityState> {
  const { user, supabase } = await requireUser();
  const withPassport = clean(fd.get("withPassport")) === "on";
  const values = {
    fullName: clean(fd.get("fullName")).replace(/\s+/g, " "), phone: clean(fd.get("phone")), next: clean(fd.get("next")),
    withPassport: withPassport ? "on" : "", biExpiry: clean(fd.get("biExpiry")), passportExpiry: clean(fd.get("passportExpiry")),
  };
  const { dates, sides } = await myIdentity(supabase, user.id); // só exige validades e segundos lados quando a base já os guarda
  const bi = clean(fd.get("bi")).replace(/[\s-]/g, "").toUpperCase();
  const passport = clean(fd.get("passport")).replace(/[\s-]/g, "").toUpperCase();
  const errors: Record<string, string> = {};

  if (values.fullName.length < 3 || values.fullName.length > 80) errors.fullName = "Escreve o nome completo, como no BI.";
  if (!phoneOk(values.phone)) errors.phone = "Indica um número com indicativo, por exemplo +244 923 000 000.";
  if (!/^[A-Z0-9]{9,16}$/.test(bi)) errors.bi = "Escreve o número do BI (letras e números, sem espaços).";
  if (withPassport && !/^[A-Z0-9]{6,12}$/.test(passport)) errors.passport = "Escreve o número do passaporte (6 a 12 letras e números, sem espaços).";
  if (dates) {
    const e1 = expiryError(values.biExpiry, today(), "BI");
    if (e1) errors.biExpiry = e1;
    if (withPassport) { const e2 = expiryError(values.passportExpiry, today(), "passaporte"); if (e2) errors.passportExpiry = e2; }
  }
  if (clean(fd.get("ok")) !== "on") errors.ok = "Tens de confirmar para continuar.";

  const biPhoto = await readPhoto(fd, "biPhoto", sides ? "da frente do BI" : "do BI", errors, true);
  const biBack = sides ? await readPhoto(fd, "biBack", "do verso do BI", errors, true) : null;
  const ppPhoto = withPassport ? await readPhoto(fd, "passportPhoto", sides ? "da 2.ª página do passaporte" : "do passaporte", errors, true) : null;
  const ppLast = withPassport && sides ? await readPhoto(fd, "passportLast", "da última página do passaporte", errors, true) : null;
  if (Object.keys(errors).length) return { errors, values };

  if (!piiReady()) return { errors: {}, values, formError: "De momento não conseguimos receber documentos em segurança. Fala com a equipa." };
  if (await isLimited("ident-user", user.id, 6, 15 * 60)) return { errors: {}, values, formError: TOO_MANY };
  await recordHit("ident-user", user.id);

  const { data: old } = await supabase.from("identities").select("bi_photo_path, passport_photo_path" + (sides ? ", bi_back_path, passport_last_path" : "")).eq("user_id", user.id).maybeSingle();

  const uploaded: string[] = [];
  let failReason = "";
  const put = async (p: { bytes: Uint8Array; kind: keyof typeof MIME }, tag: string) => {
    if (failReason) return null;
    const path = `${user.id}/${tag}-${crypto.randomUUID()}.${p.kind}`;
    const up = await uploadFile(supabase, "ids", path, p.bytes, MIME[p.kind]);
    if (!up.ok) { failReason = up.reason; return null; }
    uploaded.push(path);
    return path;
  };
  const biPath = await put(biPhoto!, "bi");
  const biBackPath = biBack ? await put(biBack, "bi-verso") : null;
  const ppPath = ppPhoto ? await put(ppPhoto, "passaporte") : null;
  const ppLastPath = ppLast ? await put(ppLast, "passaporte-ultima") : null;
  if (!biPath || (biBack && !biBackPath) || (ppPhoto && !ppPath) || (ppLast && !ppLastPath)) {
    if (uploaded.length) await supabase.storage.from("ids").remove(uploaded);
    return { errors: {}, values, formError: `Não foi possível enviar as fotos agora. Tenta de novo daqui a pouco. (Motivo técnico: ${failReason || "desconhecido"})` };
  }

  const row = {
    user_id: user.id, full_name: values.fullName, phone: values.phone,
    bi_enc: encryptPii(bi), bi_last4: bi.slice(-4), bi_photo_path: biPath,
    passport_enc: withPassport ? encryptPii(passport) : null,
    passport_last4: withPassport ? passport.slice(-4) : null,
    passport_photo_path: ppPath,
    ...(sides ? { bi_back_path: biBackPath, passport_last_path: ppLastPath } : {}),
    ...(dates ? { bi_expiry: values.biExpiry, passport_expiry: withPassport ? values.passportExpiry : null } : {}),
  };
  const { error } = await supabase.from("identities").upsert(row, { onConflict: "user_id" });
  if (error) {
    await supabase.storage.from("ids").remove(uploaded);
    // Só o código e o texto do erro (nomes de regras e colunas, nunca os valores escritos): para se perceber a causa logo ao primeiro erro.
    const reason = `${error.code ? error.code + ": " : ""}${error.message}`.slice(0, 200);
    console.error(`[identificacao] gravação falhou: ${reason}`);
    Sentry.captureMessage(`Gravar a identificação falhou: ${reason}`, "error");
    return { errors: {}, values, formError: `Não foi possível guardar a identificação agora. Tenta de novo daqui a pouco. (Motivo técnico: ${reason})` };
  }
  await saveIdHashes(supabase, user.id, bi, withPassport ? passport : null); // para a equipa detetar o mesmo número noutra conta
  // Troca feita: as fotos antigas já não servem.
  const o = old as Record<string, string | null> | null;
  const stale = [o?.bi_photo_path, o?.passport_photo_path, o?.bi_back_path, o?.passport_last_path].filter((p): p is string => !!p && !uploaded.includes(p));
  if (stale.length) await supabase.storage.from("ids").remove(stale);

  revalidatePath("/", "layout");
  redirect(NEXT.has(values.next) ? values.next : "/");
}
