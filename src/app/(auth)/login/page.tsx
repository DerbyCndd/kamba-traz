import type { Metadata } from "next";
import { LogoMark } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; para?: string }> }) {
  const { erro, para: raw } = await searchParams;
  const para = raw === "pedir" || raw === "viajar" ? raw : undefined;
  return (
    <section>
      <div className="panel narrow">
        <div className="authhead"><LogoMark size={42} /><h2>Entrar na tua conta</h2></div>
        {erro === "link" ? (
          <div className="notice bad">Esse link expirou ou já foi usado. Entra com a tua palavra-passe, ou pede um novo email abaixo.</div>
        ) : null}
        <LoginForm para={para} />
      </div>
    </section>
  );
}
