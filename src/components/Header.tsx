import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { getPendingCount } from "@/lib/data";
import { logout } from "@/app/(auth)/actions";
import { NavLinks } from "./NavLinks";

export async function Header() {
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";
  const pending = isAdmin ? await getPendingCount() : 0;

  // Mesma navegação para todos; a ligação da equipa só existe para administradores.
  // A protecção verdadeira está no servidor (requireAdmin + RLS), isto só evita mostrar o que não serve.
  const items: [string, string][] = profile
    ? [["/", "Início"], ["/quadro", "Quadro"], ["/pedir", "Pedir envio"], ["/viajar", "Vou viajar"], ["/regras", "Regras"], ["/meus", "Os meus"],
       ...(isAdmin ? [["/admin", pending ? `Equipa (${pending})` : "Equipa"] as [string, string]] : [])]
    : [["/regras", "Regras"]];

  return (
    <header>
      <div className="top">
        <Link className="brand" href="/" aria-label="Kamba Traz, início"><span className="tag" aria-hidden="true" />Kamba Traz</Link>
        <NavLinks items={items} />
        {!profile ? (
          <div className="row authcta">
            <Link className="btn small" href="/login">Entrar</Link>
            <Link className="btn small primary" href="/registo">Criar conta</Link>
          </div>
        ) : null}
      </div>
      {profile ? (
        <div className="userbar">
          <span>{profile.full_name || profile.email}</span>
          {isAdmin ? <span className="pill info" title="Tens acesso ao painel da equipa">EQUIPA</span> : null}
          <form action={logout}><button className="linkbtn" type="submit">Sair</button></form>
        </div>
      ) : null}
    </header>
  );
}
