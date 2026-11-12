"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: [string, string][] }) {
  const path = usePathname();
  return (
    <nav aria-label="Principal">
      {items.map(([href, text]) => {
        const current = href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
        return <Link key={href} href={href} aria-current={current ? "page" : undefined}>{text}</Link>;
      })}
    </nav>
  );
}
