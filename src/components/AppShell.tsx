import Link from "next/link";
import { getPendingCount, getPendingRatings } from "@/lib/data";
import { MobileMenu } from "./MobileMenu";
import { ProfileMenu, type Who } from "./ProfileMenu";
import { SideNav, type NavItem } from "./SideNav";

type Profile = { id: string; email: string; full_name: string; role: string };

/** Estrutura de quem tem sessão: barra lateral no PC, barra de baixo e menu de perfil no telemóvel. */
export async function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const admin = profile.role === "admin";
  const [pending, toRate] = await Promise.all([admin ? getPendingCount() : 0, getPendingRatings().then((l) => l.length)]);
  const who: Who = { name: profile.full_name, email: profile.email, admin };

  const main: NavItem[] = [
    { href: "/", label: "Início", icon: "home" },
    { href: "/quadro", label: "Quadro", icon: "board" },
  ];
  const actions: NavItem[] = [
    { href: "/pedir", label: "Pedir envio", icon: "box" },
    { href: "/viajar", label: "Vou viajar", icon: "plane" },
  ];
  const account: NavItem[] = [
    { href: "/meus", label: "Os meus", icon: "list", badge: toRate },
    { href: "/regras", label: "Regras", icon: "shield" },
  ];
  // Só quem é da equipa vê a ligação. A protecção verdadeira está no servidor (requireAdmin + RLS).
  const team: NavItem[] = admin ? [{ href: "/admin", label: "Painel da equipa", icon: "team", badge: pending }] : [];
  const tabs: NavItem[] = [...main, ...actions, { href: "/meus", label: "Os meus", icon: "list", badge: toRate }];

  return (
    <div className="app">
      <aside className="side">
        <Link className="brand" href="/" aria-label="Kamba Traz, início"><span className="tag" aria-hidden="true" />Kamba Traz</Link>
        <div className="sidescroll">
          <SideNav items={main} label="Principal" />
          <p className="sidehd">Enviar e viajar</p>
          <SideNav items={actions} label="Acções" />
          <p className="sidehd">A minha conta</p>
          <SideNav items={account} label="Conta" />
          {team.length ? (<><p className="sidehd">Equipa</p><SideNav items={team} label="Equipa" /></>) : null}
        </div>
        <ProfileMenu who={who} />
      </aside>

      <div className="appmain">
        <header className="mtop">
          <Link className="brand" href="/" aria-label="Kamba Traz, início"><span className="tag" aria-hidden="true" />Kamba Traz</Link>
          <MobileMenu who={who} pending={pending} />
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
      </div>

      <SideNav items={tabs} variant="tabs" label="Principal (telemóvel)" />
    </div>
  );
}
