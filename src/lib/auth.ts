import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

/** Utilizador da sessão (ou null). Só conta se o email estiver verificado. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user && user.email_confirmed_at ? user : null;
});

export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  return { id: user.id, email: user.email ?? "", full_name: data?.full_name || "", role: (data?.role as string) || "user" };
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return { user, supabase: await createClient() };
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");
  return { profile, supabase: await createClient() };
}
