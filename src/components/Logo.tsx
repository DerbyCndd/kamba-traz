/**
 * A marca da Kamba Traz: uma mala amarela com uma etiqueta de bagagem pendurada, e o K na etiqueta.
 * Fundo azul-noite próprio (funciona sobre claro e escuro). A mesma forma está em src/app/icon.svg e em Logos/.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="#0D1530"/>
      <path d="M20 26v-5a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v5" fill="none" stroke="#FFC52A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="7" y="25" width="42" height="32" rx="9" fill="#FFC52A"/>
      <path d="M7 34h42" stroke="#0D1530" strokeWidth="1.6" strokeDasharray="3 3"/>
      <path d="M40 30C46 28 49 32 49 37" fill="none" stroke="#F4F6FF" strokeWidth="1.8" strokeLinecap="round"/>
      <g transform="rotate(10 50 44)">
      <rect x="40" y="36" width="19" height="22" rx="5" fill="#F4F6FF"/>
      <circle cx="54" cy="40.5" r="1.5" fill="#0D1530"/>
      <path d="M46 44.5V56.5M46 50.5L52 44.5M46 50.5L52 56.5" fill="none" stroke="#0D1530" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
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
