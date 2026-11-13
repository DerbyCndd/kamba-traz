import { FAQ } from "@/lib/faq";
import { Faq } from "./ui";

export function FaqBlock() {
  return (
    <section>
      <h2>Dúvidas</h2>
      <Faq items={FAQ} />
    </section>
  );
}
