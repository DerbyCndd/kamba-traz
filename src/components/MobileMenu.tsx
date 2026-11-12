"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/(auth)/actions";
import { Icon } from "./Icons";
import { initials, type Who } from "./ProfileMenu";

/** No telemóvel: botão com as iniciais no topo, que abre uma folha com o perfil e as ligações secundárias. */
export function MobileMenu({ who, pending }: { who: Who; pending: number }) {
  // O menu fica aberto só enquanto a página não muda: mudar de página fecha-o sem efeitos.
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const setOpen = (v: boolean | ((x: boolean) => boolean)) => setOpenAt((cur) => ((typeof v === "function" ? v(cur === path) : v) ? path : null));

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenAt(null); };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button type="button" className="avatar btn-avatar" aria-label="Abrir menu da conta" aria-expanded={open} aria-controls="msheet" onClick={() => setOpen(true)}>
        {initials(who.name, who.email)}
        {pending ? <i className="dot" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <div className="mscrim" onClick={() => setOpen(false)}>
          <div className="msheet" id="msheet" role="dialog" aria-modal="true" aria-label="Menu da conta" onClick={(e) => e.stopPropagation()}>
            <div className="mhead">
              <span className="avatar big" aria-hidden="true">{initials(who.name, who.email)}</span>
              <div className="pinfo"><b>{who.name || "Sem nome"}</b><span>{who.email}</span>{who.admin ? <em className="pill info">EQUIPA</em> : null}</div>
              <button type="button" className="mclose" aria-label="Fechar menu" onClick={() => setOpen(false)}><Icon name="close" size={22} /></button>
            </div>
            <nav className="mlinks" aria-label="Conta">
              <Link href="/perfil"><Icon name="user" />Meu perfil</Link>
              <Link href="/meus"><Icon name="list" />Os meus pedidos e viagens</Link>
              <Link href="/regras"><Icon name="shield" />Regras de segurança</Link>
              {who.admin ? <Link href="/admin"><Icon name="team" />Painel da equipa{pending ? <b className="badge">{pending}</b> : null}</Link> : null}
            </nav>
            <form action={logout}><button type="submit" className="btn mout"><Icon name="logout" size={20} />Sair da conta</button></form>
          </div>
        </div>
      ) : null}
    </>
  );
}
