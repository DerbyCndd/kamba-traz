import Link from "next/link";
import { getMyDeals, getOffersWaiting, getPendingCount, getPendingRatings } from "@/lib/data";
import { Icon } from "./Icons";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ProfileMenu, type Who } from "./ProfileMenu";
import { SideNav, type NavItem } from "./SideNav";
import { SiteFooter, type FooterColumn } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";

const APP_COLUMNS: FooterColumn[] = [
  { title: "A minha conta", links: [["/propostas", "Propostas"], ["/meus", "Os meus"], ["/entregas", "Entregas"], ["/carteira", "Carteira"], ["/perfil", "Meu perfil"]] },
  { title: "Ajuda", links: [["/tutorial", "Como usar"], ["/regras", "Regras"], ["/termos", "Termos de uso"], ["/privacidade", "Privacidade"], ["/declaracao", "Declaração de conteúdo"], ["/fontes", "Fontes"], ["/feedback", "Deixe o seu feedback"]] },
];

type Profile = { id: string; email: string; full_name: string; role: string };

/** Estrutura de quem tem sessão: barra lateral no PC, barra de baixo e menu de perfil no telemóvel. */
export async function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const admin = profile.role === "admin";
  const [pending, toRate, mine, offers] = await Promise.all([admin ? getPendingCount() : 0, getPendingRatings().then((l) => l.length), getMyDeals(), getOffersWaiting(profile.id)]);
  // Entregas à espera de uma acção do entregador: pegar a encomenda ou confirmar a entrega.
  const toDo = mine.filter((d) => d.traveler_id === profile.id && (d.status === "garantia" || d.status === "transito")).length;
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
    { href: "/propostas", label: "Propostas", icon: "edit", badge: offers },
    { href: "/meus", label: "Os meus", icon: "list", badge: toRate },
    { href: "/entregas", label: "Entregas", icon: "pin", badge: toDo },
    { href: "/carteira", label: "Carteira", icon: "wallet" },
    { href: "/regras", label: "Regras", icon: "shield" },
  ];
  // Só quem é da equipa vê a ligação. A protecção verdadeira está no servidor (requireAdmin + RLS).
  const team: NavItem[] = admin ? [{ href: "/admin", label: "Painel da equipa", icon: "team", badge: pending }] : [];
  // Barra de baixo do telemóvel: o miolo do uso (negociar, entregar, pedir, viajar). «Os meus» e o resto ficam no menu da conta.
  const tabs: NavItem[] = [
    { href: "/quadro", label: "Quadro", icon: "board" },
    { href: "/propostas", label: "Propostas", icon: "edit", badge: offers },
    { href: "/entregas", label: "Entregas", icon: "pin", badge: toDo },
    { href: "/pedir", label: "Pedir", icon: "box" },
    { href: "/viajar", label: "Viajar", icon: "plane" },
  ];

  return (
    <div className="app">
      <aside className="side">
        <div className="sidehead">
          <Link className="brand" href="/" aria-label="Kamba Traz, início"><Logo /></Link>
          <ThemeToggle />
        </div>
        <div className="sidescroll">
          <SideNav items={[...main, ...actions, ...account, ...team]} label="Principal" />
        </div>
        <Link className="feedlink" href="/feedback"><Icon name="chat" size={18} />Deixe o seu feedback</Link>
        <ProfileMenu who={who} />
      </aside>

      <div className="appmain">
        <header className="mtop">
          <Link className="brand" href="/" aria-label="Kamba Traz, início"><Logo /></Link>
          <div className="mright"><ThemeToggle /><MobileMenu who={who} pending={pending} offers={offers} toRate={toRate} /></div>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
        <div className="appfoot"><SiteFooter columns={APP_COLUMNS} /></div>
      </div>

      <SideNav items={tabs} variant="tabs" label="Principal (telemóvel)" />
    </div>
  );
}
