"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export type PhotoState = { error?: string; done?: boolean };

const MAX_PHOTO = 2 * 1024 * 1024;
const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

/** Confirma pelo conteúdo (não pelo nome nem pelo tipo declarado) que o ficheiro é mesmo uma imagem aceite. */
function imageKind(b: Uint8Array): keyof typeof MIME | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
}

export async function uploadPhoto(_: PhotoState, fd: FormData): Promise<PhotoState> {
  const { user, supabase } = await requireUser();
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolhe uma foto." };
  if (file.size > MAX_PHOTO) return { error: "A foto é demasiado grande (máximo 2 MB)." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = imageKind(bytes);
  if (!kind) return { error: "Usa uma foto em JPG, PNG ou WebP." };

  const { data: old } = await supabase.from("profiles").select("photo_path").eq("id", user.id).maybeSingle();
  const path = `${user.id}/${crypto.randomUUID()}.${kind}`;
  const up = await supabase.storage.from("avatars").upload(path, bytes, { contentType: MIME[kind], upsert: false });
  if (up.error) return { error: "Não foi possível enviar a foto agora. Tenta de novo daqui a pouco." };

  const { error } = await supabase.rpc("set_my_photo", { p_path: path });
  if (error) {
    await supabase.storage.from("avatars").remove([path]); // não deixa a foto órfã
    return { error: "Não foi possível guardar a foto agora. Tenta de novo daqui a pouco." };
  }
  if (old?.photo_path) await supabase.storage.from("avatars").remove([old.photo_path]);
  revalidatePath("/perfil");
  revalidatePath("/viajar");
  return { done: true };
}
