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

  function up() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    // Leva também o foco ao início, para quem navega com o teclado ou com leitor de ecrã.
    document.querySelector<HTMLElement>(".skip")?.focus({ preventScroll: true });
  }

  return (
    <button type="button" className={"totop" + (show ? " show" : "")} onClick={up} aria-label="Voltar ao topo" tabIndex={show ? 0 : -1} aria-hidden={show ? undefined : true}>
      <Icon name="up" size={20} />
    </button>
  );
}
