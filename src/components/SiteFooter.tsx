import Link from "next/link";
import { Logo } from "./Logo";

export type FooterColumn = { title: string; links: [href: string, text: string][] };

/** Rodapé único da Kamba Traz: logótipo, frase da marca e colunas de ligações. Só as ligações mudam entre o site e a área com sessão. */
export function SiteFooter({ columns }: { columns: FooterColumn[] }) {
  return (
    <footer className="foot">
      <div className="footgrid">
        <div className="footbrand">
          <span className="brand"><Logo /></span>
          <p className="tagline">O amigo que leva a tua encomenda.</p>
          <p className="origin">Kamba quer dizer «amigo» em kimbundu.</p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h4>{c.title}</h4>
            {c.links.map(([href, text]) => <Link key={href} href={href}>{text}</Link>)}
          </div>
        ))}
      </div>
      <p className="legal">© {new Date().getFullYear()} Kamba Traz</p>
    </footer>
  );
}
