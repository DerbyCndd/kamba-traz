import type { Metadata } from "next";
import { RecoverForm } from "./RecoverForm";

export const metadata: Metadata = { title: "Recuperar palavra-passe" };

export default function RecoverPage() {
  return (
    <section>
      <div className="panel narrow">
        <div>
          <div className="authhead"><span className="tag" aria-hidden="true" /><h2>Recuperar palavra-passe</h2></div>
          <p className="muted" style={{ marginTop: 8 }}>Indica o email da tua conta e enviamos-te um link para escolheres outra.</p>
        </div>
        <RecoverForm />
      </div>
    </section>
  );
}
