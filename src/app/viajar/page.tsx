import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { today } from "@/lib/format";
import { TripForm } from "./TripForm";

export const metadata: Metadata = { title: "Vou viajar" };

export default async function ViajarPage() {
  const [config, profile] = await Promise.all([getConfig(), getProfile()]);
  return (
    <section>
      <h2>Vou viajar e tenho espaço na mala</h2>
      <p className="muted">Ganhas dinheiro com o espaço que já tens. Tu defines o preço por kg e escolhes os pedidos que aceitas.</p>
      <TripForm perKg={config.per_kg} whatsapp={config.whatsapp} defaultName={profile?.full_name ?? ""} minDate={today()} />
    </section>
  );
}
