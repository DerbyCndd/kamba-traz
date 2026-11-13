import Link from "next/link";
import { Logo } from "./Logo";

/** Cabeçalho de quem ainda não tem sessão. Quem tem sessão usa o AppShell (barra lateral). */
export function Header() {
  return (
    <header>
      <div className="top">
        <Link className="brand" href="/" aria-label="Kamba Traz, início"><Logo /></Link>
        <div className="authcta">
          <Link className="btn small ghost" href="/login">Entrar</Link>
          <Link className="btn small primary" href="/registo">Criar conta</Link>
        </div>
      </div>
    </header>
  );
}
