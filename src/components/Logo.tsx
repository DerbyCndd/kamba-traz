import { useId } from "react";

/**
 * A marca da Kamba Traz: um K feito de mãos. A haste é um braço de mão levantada, e a perna do K é outro braço dobrado no cotovelo, também de mão levantada.
 * Duas mãos a entregar, sobre a etiqueta de bagagem. A mesma forma está em src/app/icon.svg.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs>
      <g id={`hd-${id}`} fill="#F4F6FF" stroke="#0D1530" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <rect x="-7" y="-9" width="14" height="17" rx="6"/>
        <path d="M-2.4-8.5v5.5M2.4-8.5v5.5" fill="none"/>
        <path d="M-6.5-1.5q-5.5-.5-5 3.5t5.6 3.5"/>
      </g>
    </defs>
    <path d="M15 0h34a15 15 0 0 1 15 15v34a15 15 0 0 1-15 15H27A27 27 0 0 1 0 37V15A15 15 0 0 1 15 0z" fill="#FFC52A"/>
    <g fill="none" stroke="#0D1530" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 24V54"/>
      <path d="M49 54L26 37l17-14"/>
    </g>
    <use href={`#hd-${id}`} transform="translate(19 17)" />
    <use href={`#hd-${id}`} transform="translate(46.5 18) rotate(40)" />
    </svg>
  );
}

/** Marca e nome. "Kamba" na cor do texto e "Traz" a amarelo: o que se leva. */
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <>
      <LogoMark size={small ? 24 : 34} />
      <span className="wm">Kamba<b>Traz</b></span>
    </>
  );
}
