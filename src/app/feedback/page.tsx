import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { FeedbackForm } from "./FeedbackForm";

export const metadata: Metadata = { title: "Deixe o seu feedback" };

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ de?: string }> }) {
  const [{ de }, profile] = await Promise.all([searchParams, getProfile()]);
  return (
    <section className="formwrap">
      <h2>Deixe o seu feedback</h2>
      <p className="muted">Diga-nos o que correu bem, o que podemos melhorar ou o que não funcionou. A equipa lê tudo.</p>
      <FeedbackForm defaultEmail={profile?.email ?? ""} page={de ?? ""} />
    </section>
  );
}
