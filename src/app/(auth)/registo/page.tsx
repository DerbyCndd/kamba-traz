import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <section>
      <div className="panel narrow">
        <div>
          <div className="authhead"><span className="tag" aria-hidden="true" /><h2>Criar conta</h2></div>
          <p className="muted" style={{ marginTop: 8 }}>Vamos enviar-te um email para confirmares que é teu. Só depois podes usar a app.</p>
        </div>
        <SignupForm />
      </div>
    </section>
  );
}
