import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { TwoFactor } from "./TwoFactor";

export const metadata: Metadata = { title: "Autenticação em dois passos" };

const NEXT = new Set(["/", "/admin", "/perfil"]);

export default async function SegurancaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }] = await Promise.all([searchParams, requireUser()]);
  return (
    <section>
      <h2>Autenticação em dois passos</h2>
      <p className="muted">Além da palavra-passe, pede um código da tua aplicação de autenticação. É a melhor proteção para uma conta, e é obrigatória na equipa, que vê os documentos de toda a gente.</p>
      <TwoFactor next={next && NEXT.has(next) ? next : "/perfil"} />
    </section>
  );
}
