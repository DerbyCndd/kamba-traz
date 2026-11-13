"use client";
import { Icon } from "./Icons";

/**
 * Alterna entre modo claro e escuro. O botão mostra o sol no modo escuro (leva ao claro) e a lua no modo claro:
 * quem escolhe o ícone é o CSS, por isso não há estado nem diferenças entre servidor e browser.
 * A escolha fica guardada neste dispositivo; sem escolha, segue o sistema.
 */
export function ThemeToggle({ label = false }: { label?: boolean }) {
  function toggle() {
    const el = document.documentElement;
    const now = el.getAttribute("data-theme") ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = now === "dark" ? "light" : "dark";
    el.setAttribute("data-theme", next);
    try { localStorage.setItem("kt-theme", next); } catch { /* sem armazenamento: vale só nesta visita */ }
  }
  return (
    <button type="button" className={"themebtn" + (label ? " withlabel" : "")} onClick={toggle} aria-label="Mudar entre modo claro e modo escuro" title="Modo claro ou escuro">
      <span className="t-sun"><Icon name="sun" size={20} /></span>
      <span className="t-moon"><Icon name="moon" size={20} /></span>
      {label ? <span className="tlabel"><span className="t-sun">Modo claro</span><span className="t-moon">Modo escuro</span></span> : null}
    </button>
  );
}
