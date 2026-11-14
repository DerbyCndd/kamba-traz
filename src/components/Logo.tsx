import { useId } from "react";

/**
 * A marca da Kamba Traz: um K em forma de etiqueta de bagagem, cujo braço superior é um avião de papel,
 * entregue por duas mãos. Quem leva (o avião), quem confia (a etiqueta da mala) e quem entrega (as mãos). A mesma forma está em src/app/icon.svg.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <g transform="translate(9 1) scale(.72)">
      <path d="M15 0h34a15 15 0 0 1 15 15v34a15 15 0 0 1-15 15H27A27 27 0 0 1 0 37V15A15 15 0 0 1 15 0z" fill="#FFC52A"/>
      <path d="M19 14v36M27 33.5l19 16.5" fill="none" stroke="#0D1530" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M27.5 33.5l13-12" fill="none" stroke="#0D1530" strokeWidth="8.5" strokeLinecap="round"/>
      <path d="M55 8.5L34.5 14.8l9 5.4 3.3 10.3z" fill="#0D1530" stroke="#0D1530" strokeWidth="2.6" strokeLinejoin="round"/>
    </g>
    <g id={`h-${id}`} stroke="#0D1530" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M9 51.5L27 44.5q4-1.2 4.6 1.8t-2 4.2q3 .2 2.6 3.2t-3.6 3.1q2.6.6 2 3.2t-3.6 2.5L9 63z" fill="#F4F6FF"/>
      <path d="M12 49.5q1.6-5.4 7.2-4.6" fill="#F4F6FF"/>
      <path d="M29.6 50.6h-6.4M29 56.2h-6" fill="none"/>
      <path d="M0 49.5h9.5v14H0z" fill="#0D1530"/>
    </g>
    <use href={`#h-${id}`} transform="translate(64 0) scale(-1 1)"/>
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
