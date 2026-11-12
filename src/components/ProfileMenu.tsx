"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/(auth)/actions";
import { Icon } from "./Icons";

export type Who = { name: string; email: string; admin: boolean };

export const initials = (name: string, email: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const s = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? email).slice(0, 2);
  return s.toUpperCase();
};

/** Cartão do utilizador no fundo da barra lateral. Abre um menu com o perfil e o botão de sair. */
export function ProfileMenu({ who }: { who: Who }) {
  // O menu fica aberto só enquanto a página não muda: mudar de página fecha-o sem efeitos.
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const setOpen = (v: boolean | ((x: boolean) => boolean)) => setOpenAt((cur) => ((typeof v === "function" ? v(cur === path) : v) ? path : null));
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpenAt(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenAt(null); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div className="pmenu" ref={box}>
      {open ? (
        <div className="ppop" id="ppop" role="menu" aria-label="Conta">
          <div className="pinfo"><b>{who.name || "Sem nome"}</b><span>{who.email}</span></div>
          <Link role="menuitem" href="/perfil"><Icon name="user" size={18} />Meu perfil</Link>
          <Link role="menuitem" href="/meus"><Icon name="list" size={18} />Os meus pedidos</Link>
          {who.admin ? <Link role="menuitem" href="/admin"><Icon name="team" size={18} />Painel da equipa</Link> : null}
          <form action={logout}><button role="menuitem" type="submit" className="out"><Icon name="logout" size={18} />Sair</button></form>
        </div>
      ) : null}
      <button type="button" className="pbtn" aria-haspopup="menu" aria-expanded={open} aria-controls="ppop" onClick={() => setOpen((v) => !v)}>
        <span className="avatar" aria-hidden="true">{initials(who.name, who.email)}</span>
        <span className="pwho"><b>{who.name || who.email}</b><small>{who.admin ? "Equipa Kamba Traz" : "Meu perfil"}</small></span>
        <span className={"chev" + (open ? " up" : "")}><Icon name="up" size={18} /></span>
      </button>
    </div>
  );
}
