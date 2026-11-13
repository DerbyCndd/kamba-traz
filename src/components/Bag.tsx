/**
 * A mala de ráfia xadrez (vermelho, azul e branco) com que a diáspora manda encomendas para Angola,
 * com a etiqueta da Kamba Traz pendurada no fecho. Ilustração desenhada para a marca.
 */
export function Bag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 380 320" role="img" aria-label="Uma mala de ráfia xadrez com a etiqueta da Kamba Traz pendurada">
      <defs>
        <pattern id="kt-chk" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#F2F4FF" />
          <rect y="5" width="30" height="10" fill="#D3241A" opacity=".93" />
          <rect x="5" width="10" height="30" fill="#1636B5" opacity=".9" />
        </pattern>
      </defs>
      <ellipse cx="190" cy="300" rx="158" ry="13" fill="#000" opacity=".4" />
      {/* alças */}
      <path d="M118 134C118 48 262 48 262 134" fill="none" stroke="#33437D" strokeWidth="17" strokeLinecap="round" />
      <path d="M118 134C118 48 262 48 262 134" fill="none" stroke="#5B73D6" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="2 11" />
      {/* corpo */}
      <path d="M38 134h304a16 16 0 0 1 16 16v120a26 26 0 0 1-26 26H48a26 26 0 0 1-26-26V150a16 16 0 0 1 16-16z" fill="url(#kt-chk)" stroke="#33437D" strokeWidth="6" strokeLinejoin="round" />
      {/* faixa do fecho */}
      <rect x="22" y="134" width="336" height="26" rx="7" fill="#243268" />
      <path d="M36 147h308" stroke="#FFC52A" strokeWidth="4" strokeDasharray="5 6" strokeLinecap="round" />
      <rect x="170" y="125" width="48" height="23" rx="8" fill="#FFC52A" stroke="#0D1530" strokeWidth="4" />
      {/* a etiqueta pendurada */}
      <path d="M300 149C334 168 334 188 322 210" fill="none" stroke="#9BA7C9" strokeWidth="3.5" strokeLinecap="round" />
      <g transform="translate(302 204) rotate(12) scale(.92)">
        <path d="M15 0h34a15 15 0 0 1 15 15v34a15 15 0 0 1-15 15H27A27 27 0 0 1 0 37V15A15 15 0 0 1 15 0z" fill="#FFC52A" stroke="#0D1530" strokeWidth="3.5" />
        <path d="M19 14v36M27 33.5l19 16.5" fill="none" stroke="#0D1530" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M27.5 33.5l13-12" fill="none" stroke="#0D1530" strokeWidth="8.5" strokeLinecap="round" />
        <path d="M55 8.5L34.5 14.8l9 5.4 3.3 10.3z" fill="#0D1530" stroke="#0D1530" strokeWidth="2.6" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
