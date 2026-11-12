/**
 * A marca da Kamba Traz: um K em forma de etiqueta de bagagem, cujo braço superior é um avião de papel.
 * Quem leva (o avião) e quem confia (a etiqueta da mala). A mesma forma está em src/app/icon.svg.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M15 0h34a15 15 0 0 1 15 15v34a15 15 0 0 1-15 15H27A27 27 0 0 1 0 37V15A15 15 0 0 1 15 0z" fill="#FFC52A" />
      <path d="M19 14v36M27 33.5l19 16.5" fill="none" stroke="#0D1530" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27.5 33.5l13-12" fill="none" stroke="#0D1530" strokeWidth="8.5" strokeLinecap="round" />
      <path d="M55 8.5L34.5 14.8l9 5.4 3.3 10.3z" fill="#0D1530" stroke="#0D1530" strokeWidth="2.6" strokeLinejoin="round" />
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
