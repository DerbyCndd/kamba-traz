"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icons";

export type NavItem = { href: string; label: string; icon: IconName; badge?: number };

/** Ligação activa: a página inicial só conta no "/" exacto; as outras também nas subpáginas. */
export const isCurrent = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

/** Lista de ligações da barra lateral (PC) ou da barra de baixo (telemóvel). */
export function SideNav({ items, variant = "side", label = "Principal" }: { items: NavItem[]; variant?: "side" | "tabs"; label?: string }) {
  const path = usePathname();
  return (
    <nav className={variant === "tabs" ? "tabbar" : "sidenav"} aria-label={label}>
      {items.map((it) => {
        const current = isCurrent(path, it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={current ? "page" : undefined}>
            <span className="ico"><Icon name={it.icon} size={variant === "tabs" ? 22 : 20} />{it.badge ? <i className="dot" aria-hidden="true" /> : null}</span>
            <span className="lbl">{it.label}</span>
            {variant === "side" && it.badge ? <b className="badge" aria-label={`${it.badge} pendentes`}>{it.badge}</b> : null}
          </Link>
        );
      })}
    </nav>
  );
}
