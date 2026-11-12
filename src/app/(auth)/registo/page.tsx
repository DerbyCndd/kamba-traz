import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  const { para: raw } = await searchParams;
  const para = raw === "pedir" || raw === "viajar" ? raw : undefined;
  return (
    <section>
      <div className="panel narrow">
        <div>
          <div className="authhead"><span className="tag" aria-hidden="true" /><h2>{para === "pedir" ? "Cria a conta para pedir o teu envio" : para === "viajar" ? "Cria a conta para publicar a tua viagem" : "Criar conta"}</h2></div>
          <p className="muted" style={{ marginTop: 8 }}>Vamos enviar-te um email para confirmares que é teu. Só depois podes usar a app.</p>
        </div>
        <SignupForm para={para} />
      </div>
    </section>
  );
}
