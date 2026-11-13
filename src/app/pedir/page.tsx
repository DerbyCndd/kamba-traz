import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { today } from "@/lib/format";
import { RequestForm } from "./RequestForm";

export const metadata: Metadata = { title: "Pedir envio" };

export default async function PedirPage() {
  const [config, profile] = await Promise.all([getConfig(), getProfile()]);
  return (
    <section>
      <h2>Quero enviar uma encomenda</h2>
      <p className="muted">Demora dois minutos. A equipa verifica e publica.</p>
      <div className="formwrap">
        <RequestForm perKg={config.per_kg} whatsapp={config.whatsapp} defaultName={profile?.full_name ?? ""} minDate={today()} />
      </div>
    </section>
  );
}
