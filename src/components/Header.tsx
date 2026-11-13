import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

/** Cabeçalho de quem ainda não tem sessão. Quem tem sessão usa o AppShell (barra lateral). */
export function Header() {
  return (
    <header>
      <div className="top">
        <Link className="brand" href="/" aria-label="Kamba Traz, início"><Logo /></Link>
        <nav className="toplinks" aria-label="Principal">
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/#seguranca">Segurança</Link>
          <Link href="/#duvidas">Dúvidas</Link>
        </nav>
        <div className="authcta">
          <ThemeToggle />
          <Link className="btn small ghost" href="/login">Entrar</Link>
          <Link className="btn small primary" href="/registo">Criar conta</Link>
        </div>
      </div>
    </header>
  );
}
