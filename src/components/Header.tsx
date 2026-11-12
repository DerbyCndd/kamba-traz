import Link from "next/link";

/** Cabeçalho de quem ainda não tem sessão. Quem tem sessão usa o AppShell (barra lateral). */
export function Header() {
  return (
    <header>
      <div className="top">
        <Link className="brand" href="/" aria-label="Kamba Traz, início"><span className="tag" aria-hidden="true" />Kamba Traz</Link>
        <nav aria-label="Principal"><Link href="/regras">Regras</Link></nav>
        <div className="row authcta">
          <Link className="btn small" href="/login">Entrar</Link>
          <Link className="btn small primary" href="/registo">Criar conta</Link>
        </div>
      </div>
    </header>
  );
}
