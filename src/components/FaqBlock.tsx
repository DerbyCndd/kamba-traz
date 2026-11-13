import { FAQ } from "@/lib/faq";
import { Faq } from "./ui";

export function FaqBlock() {
  return (
    <section id="duvidas">
      <div className="sechead">
        <h2>Dúvidas frequentes</h2>
        <p className="muted">As perguntas que mais nos fazem.</p>
      </div>
      <Faq items={FAQ} />
    </section>
  );
}
