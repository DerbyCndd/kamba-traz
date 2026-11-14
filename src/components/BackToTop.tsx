"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";

/** Botão para voltar ao topo: aparece depois de descer a página e respeita «reduzir movimento». */
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function up(e: React.MouseEvent<HTMLButtonElement>) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    // Só com o teclado (detail 0) leva o foco ao início; com o toque, o link «Saltar» ficaria à vista no topo.
    if (e.detail === 0) document.querySelector<HTMLElement>(".skip")?.focus({ preventScroll: true });
    else (e.currentTarget as HTMLElement).blur();
  }

  return (
    <button type="button" className={"totop" + (show ? " show" : "")} onClick={up} aria-label="Voltar ao topo" tabIndex={show ? 0 : -1} aria-hidden={show ? undefined : true}>
      <Icon name="up" size={20} />
    </button>
  );
}
