import Link from "next/link";
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

const PILLS: Record<string, [string, string]> = {
  aberto: ["ok", "Aberto"],
  ligado: ["info", "Com viajante"],
  entregue: ["ok", "Entregue"],
  cheia: ["warn", "Mala cheia"],
  concluida: ["bad", "Concluída"],
  pendente: ["warn", "Em verificação"],
  recusado: ["bad", "Recusado"],
};

export function StatusPill({ status }: { status: string }) {
  const [cls, text] = PILLS[status] ?? PILLS.aberto;
  return <span className={"pill " + cls}>{text}</span>;
}

export function ExBadge({ example }: { example?: boolean }) {
  return example ? <span className="pill ex" title="Registo de demonstração">EXEMPLO</span> : null;
}

export function Empty({ title, text, cta, href }: { title: string; text: string; cta?: string; href?: string }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {cta && href ? <Link className="btn primary" href={href}>{cta}</Link> : null}
    </div>
  );
}

export function Field({ id, label, hint, error, full, children }: {
  id: string; label: string; hint?: string; error?: string; full?: boolean; children: ReactNode;
}) {
  // Liga o campo à dica e ao erro para os leitores de ecrã, e marca-o como inválido.
  const describedBy = [hint ? id + "-h" : "", error ? id + "-e" : ""].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, { "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })
    : children;
  return (
    <div className={"field" + (full ? " full" : "")}>
      <label htmlFor={id}>{label}</label>
      {control}
      {hint ? <span className="hint" id={id + "-h"}>{hint}</span> : null}
      <span className="err" id={id + "-e"} role="alert">{error || ""}</span>
    </div>
  );
}

export function Faq({ items }: { items: [string, string][] }) {
  return (
    <div className="faq">
      {items.map(([q, a]) => (
        <details key={q}><summary>{q}</summary><p>{a}</p></details>
      ))}
    </div>
  );
}
