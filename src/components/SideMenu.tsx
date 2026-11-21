"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icons";
import { isCurrent, type NavItem } from "./SideNav";

export type SideGroup = { title: string; items: NavItem[]; collapsible?: { icon: IconName } };

function Item({ it, path }: { it: NavItem; path: string }) {
  return (
    <Link href={it.href} aria-current={isCurrent(path, it.href) ? "page" : undefined}>
      <span className="ico"><Icon name={it.icon} size={20} /></span>
      <span className="lbl">{it.label}</span>
      {it.badge ? <b className="badge">{it.badge}<span className="sr"> pendentes</span></b> : null}
    </Link>
  );
}

/**
 * Barra lateral organizada por função, não por ordem de chegada:
 *  1. as duas ações que começam tudo («Pedir envio» e «Vou viajar») em botões com o mesmo destaque (os dois lados pesam o mesmo),
 *     longe da lista de páginas;
 *  2. o que se usa todos os dias, num bloco de 5 ou menos, com os números de pendentes;
 *  3. a ajuda recolhida (abre sozinha quando se está numa página dela);
 *  4. a equipa, à parte, só para quem é da equipa.
 */
export function SideMenu({ actions, groups, label }: { actions: NavItem[]; groups: SideGroup[]; label: string }) {
  const path = usePathname();
  return (
    <>
      <div className="sideactions">
        {actions.map((a) => (
          <Link key={a.href} className="btn small primary" href={a.href} aria-current={isCurrent(path, a.href) ? "page" : undefined}>
            <Icon name={a.icon} size={18} />{a.label}
          </Link>
        ))}
      </div>
      <nav className="sidenav" aria-label={label}>
        {groups.map((g, gi) => {
          const items = g.items.map((it) => <Item key={it.href} it={it} path={path} />);
          if (!g.collapsible) {
            return (
              <div className="sidegroup" key={g.title} role="group" aria-labelledby={`sg-${gi}`}>
                <p className="sidelabel" id={`sg-${gi}`}>{g.title}</p>
                {items}
              </div>
            );
          }
          const open = g.items.some((it) => isCurrent(path, it.href));
          return (
            <details className="sidehelp" key={g.title + String(open)} open={open}>
              <summary>
                <span className="ico"><Icon name={g.collapsible.icon} size={20} /></span>
                <span className="lbl">{g.title}</span>
                <span className="chev" aria-hidden="true"><Icon name="up" size={16} /></span>
              </summary>
              <div className="sidegroup">{items}</div>
            </details>
          );
        })}
      </nav>
    </>
  );
}
