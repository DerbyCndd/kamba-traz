import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <section>
      <div className="panel narrow">
        <div className="authhead"><span className="tag" aria-hidden="true" /><h2>Entrar na tua conta</h2></div>
        {erro === "link" ? (
          <div className="notice bad">Esse link expirou ou já foi usado. Entra com a tua palavra-passe, ou pede um novo email abaixo.</div>
        ) : null}
        <LoginForm />
      </div>
    </section>
  );
}
