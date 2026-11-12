import type { Metadata } from "next";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata: Metadata = { title: "Nova palavra-passe" };

export default function NewPasswordPage() {
  return (
    <section>
      <div className="panel narrow">
        <h2>Escolhe uma nova palavra-passe</h2>
        <NewPasswordForm />
      </div>
    </section>
  );
}
