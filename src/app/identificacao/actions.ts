"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
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
    withPassport: withPassport ? "on" : "",
  };
  const bi = clean(fd.get("bi")).replace(/[\s-]/g, "").toUpperCase();
  const passport = clean(fd.get("passport")).replace(/[\s-]/g, "").toUpperCase();
  const errors: Record<string, string> = {};

  if (values.fullName.length < 3 || values.fullName.length > 80) errors.fullName = "Escreve o nome completo, como no BI.";
  if (!phoneOk(values.phone)) errors.phone = "Indica um número com indicativo, por exemplo +244 923 000 000.";
  if (!/^[A-Z0-9]{9,16}$/.test(bi)) errors.bi = "Escreve o número do BI (letras e números, sem espaços).";
  if (withPassport && !/^[A-Z0-9]{6,12}$/.test(passport)) errors.passport = "Escreve o número do passaporte (6 a 12 letras e números, sem espaços).";
  if (clean(fd.get("ok")) !== "on") errors.ok = "Tens de confirmar para continuar.";

  const biPhoto = await readPhoto(fd, "biPhoto", "do BI", errors, true);
  const ppPhoto = withPassport ? await readPhoto(fd, "passportPhoto", "do passaporte", errors, true) : null;
  if (Object.keys(errors).length) return { errors, values };

  if (!piiReady()) return { errors: {}, values, formError: "De momento não conseguimos receber documentos em segurança. Fala com a equipa." };
  if (await isLimited("ident-user", user.id, 6, 15 * 60)) return { errors: {}, values, formError: TOO_MANY };
  await recordHit("ident-user", user.id);

  const { data: old } = await supabase.from("identities").select("bi_photo_path, passport_photo_path").eq("user_id", user.id).maybeSingle();

  const uploaded: string[] = [];
  const put = async (p: { bytes: Uint8Array; kind: keyof typeof MIME }, tag: string) => {
    const path = `${user.id}/${tag}-${crypto.randomUUID()}.${p.kind}`;
    const up = await supabase.storage.from("ids").upload(path, p.bytes, { contentType: MIME[p.kind], upsert: false });
    if (up.error) return null;
    uploaded.push(path);
    return path;
  };
  const biPath = await put(biPhoto!, "bi");
  const ppPath = ppPhoto ? await put(ppPhoto, "passaporte") : null;
  if (!biPath || (ppPhoto && !ppPath)) {
    if (uploaded.length) await supabase.storage.from("ids").remove(uploaded);
    return { errors: {}, values, formError: "Não foi possível enviar as fotos agora. Tenta de novo daqui a pouco." };
  }

  const row = {
    user_id: user.id, full_name: values.fullName, phone: values.phone,
    bi_enc: encryptPii(bi), bi_last4: bi.slice(-4), bi_photo_path: biPath,
    passport_enc: withPassport ? encryptPii(passport) : null,
    passport_last4: withPassport ? passport.slice(-4) : null,
    passport_photo_path: ppPath,
  };
  const { error } = await supabase.from("identities").upsert(row, { onConflict: "user_id" });
  if (error) {
    await supabase.storage.from("ids").remove(uploaded);
    return { errors: {}, values, formError: "Não foi possível guardar a identificação agora. Tenta de novo daqui a pouco." };
  }
  // Troca feita: as fotos antigas já não servem.
  const stale = [old?.bi_photo_path, old?.passport_photo_path].filter((p): p is string => !!p && !uploaded.includes(p));
  if (stale.length) await supabase.storage.from("ids").remove(stale);

  revalidatePath("/", "layout");
  redirect(NEXT.has(values.next) ? values.next : "/");
}
