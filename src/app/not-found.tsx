import type { Metadata } from "next";
import { Empty } from "@/components/ui";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <section>
      <Empty title="Esta página não existe" text="O endereço pode estar errado ou a página já não está disponível." cta="Voltar ao início" href="/" />
    </section>
  );
}
