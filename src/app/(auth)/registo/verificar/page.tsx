import type { Metadata } from "next";
import Link from "next/link";
import { ResendForm } from "./ResendForm";

export const metadata: Metadata = { title: "Confirma o teu email" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  return (
    <section>
      <div className="panel narrow" role="status">
        <div>
          <span className="label">Falta um passo</span>
          <h2 style={{ marginTop: 6 }}>Confirma o teu email</h2>
        </div>
        <p>
          Enviámos uma mensagem{email ? <> para <b>{email}</b></> : null}. Abre-a e clica no link para activar a conta.
          Depois já podes entrar.
        </p>
        <p className="hint">Não chegou? Verifica a pasta de spam ou pede um novo email.</p>
        <ResendForm email={email} />
        <Link className="btn" href="/login">Ir para a entrada</Link>
      </div>
    </section>
  );
}
