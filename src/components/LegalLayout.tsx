import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icons";

export type TocItem = { id: string; title: string };
export type SummaryPoint = { icon: IconName; title: string; text: string };

/**
 * Moldura dos documentos legais: título e versão, «Em resumo» (primeira camada), índice com ligações e o texto completo (segunda camada).
 * Índice fixo ao lado em ecrãs largos; num cartão que abre e fecha em ecrãs estreitos.
 */
export function LegalLayout({ title, readMin, intro, summary, toc, related, pdf, children }: {
  title: string; readMin: number; intro: string; pdf?: string;
  summary: SummaryPoint[]; toc: TocItem[]; related: { href: string; label: string }[]; children: ReactNode;
}) {
  const list = (
    <ol>
      {toc.map((t) => <li key={t.id}><a href={"#" + t.id}>{t.title}</a></li>)}
    </ol>
  );
  return (
    <section className="doc legaldoc">
      <header className="dochead">
        <h2>{title}</h2>
        <p className="docmeta">Leitura de {readMin} min{pdf ? <span className="noprint"> · <a href={pdf} download>Descarregar em PDF</a></span> : null}</p>
        <p className="muted">{intro}</p>
      </header>

      <div className="docsummary" role="region" aria-label="Em resumo">
        <h3>Em resumo</h3>
        <ul>
          {summary.map((s) => (
            <li key={s.title}>
              <span className="ico"><Icon name={s.icon} size={20} /></span>
              <span><b>{s.title}</b> {s.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="toc tocmobile">
        <summary>Neste documento</summary>
        <nav aria-label={"Índice: " + title}>{list}</nav>
      </details>

      <div className="legalgrid">
        <div className="docbody">{children}</div>
        <aside className="toc tocside noprint" aria-label={"Índice: " + title}>
          <p className="toctitle">Neste documento</p>
          <nav>{list}</nav>
          <div className="tocrel">
            {related.map((r) => <Link key={r.href} href={r.href}>{r.label}</Link>)}
          </div>
        </aside>
      </div>
    </section>
  );
}

/** Uma secção do documento, com âncora para o índice. */
export function DocSection({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="docsec">
      <h3><span className="num">{n}.</span> {title}</h3>
      {children}
    </section>
  );
}

/** Destaque para as cláusulas que mais importam (responsabilidade, alfândega, dinheiro). */
export function Important({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="docimportant">
      <p className="itl">{title}</p>
      {children}
    </div>
  );
}
