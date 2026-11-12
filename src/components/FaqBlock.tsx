import { FAQ } from "@/lib/faq";
import { waLink } from "@/lib/format";
import { Faq } from "./ui";

/** Dúvidas comuns, com uma introdução de pessoa para pessoa. Com sessão, oferece o WhatsApp da equipa (se estiver definido). */
export function FaqBlock({ whatsapp }: { whatsapp?: string }) {
  const wa = whatsapp ? waLink(whatsapp, "Olá! Tenho uma dúvida sobre a Kamba Traz.") : null;
  return (
    <section className="faqgrid">
      <div className="faqintro">
        <h2>Dúvidas comuns</h2>
        <p className="muted">São as perguntas que mais nos fazem. Se a tua não estiver aqui, diz-nos e respondemos com gosto.</p>
        {wa ? <a className="btn" href={wa} target="_blank" rel="noopener">Falar com a equipa no WhatsApp</a> : <p className="hand">Cria a tua conta e fala com a equipa.</p>}
      </div>
      <Faq items={FAQ} />
    </section>
  );
}
