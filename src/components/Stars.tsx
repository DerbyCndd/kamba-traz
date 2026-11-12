const STAR = "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z";

const Row = () => (
  <>
    {[0, 1, 2, 3, 4].map((i) => (
      <svg key={i} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={STAR} /></svg>
    ))}
  </>
);

export const fmtAvg = (n: number) => n.toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Estrelas preenchidas até à média (com fracções). Sem avaliações mostra "Sem avaliações ainda". */
export function Stars({ avg, count, compact = false }: { avg?: number | null; count?: number | null; compact?: boolean }) {
  if (!count || avg == null) return <span className="rate none">{compact ? "Novo" : "Sem avaliações ainda"}</span>;
  const pct = Math.max(0, Math.min(100, (Number(avg) / 5) * 100));
  const label = `${fmtAvg(Number(avg))} em 5, com ${count} ${count === 1 ? "avaliação" : "avaliações"}`;
  return (
    <span className="rate" role="img" aria-label={label}>
      <span className="stars" aria-hidden="true">
        <span className="base"><Row /></span>
        <span className="fill" style={{ width: pct + "%" }}><Row /></span>
      </span>
      <b>{fmtAvg(Number(avg))}</b>
      <span className="cnt2">({count})</span>
    </span>
  );
}
