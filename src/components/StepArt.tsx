import type { ReactNode } from "react";

/**
 * Ilustrações dos passos do tutorial: ecrãs simplificados da app, desenhados com as cores e os textos reais.
 * São exemplos (dados inventados), não capturas de ecrã. Seguem o tema claro ou escuro da app.
 */
export type Tone = "ok" | "warn" | "info";
export type ListItem = { a: string; b: string; pill: string; tone: Tone };
export type Art =
  | { kind: "form"; title: string; fields: string[]; button: string; focus?: number }
  | { kind: "list"; title: string; items: ListItem[]; focus?: number }
  | { kind: "code"; title: string; label: string; digits: string; hint: string }
  | { kind: "map"; title: string; caption: string }
  | { kind: "photos"; title: string; button: string; note: string }
  | { kind: "check"; title: string; message: string };

const FONT = "var(--f-body)";
const T = ({ x, y, size = 11, weight = 400, fill = "var(--ink)", anchor = "start", mono = false, children }: { x: number; y: number; size?: number; weight?: number; fill?: string; anchor?: "start" | "middle" | "end"; mono?: boolean; children: ReactNode }) => (
  <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} fontFamily={mono ? "var(--f-mono)" : FONT}>{children}</text>
);
const TONE: Record<Tone, [string, string]> = { ok: ["var(--ok-bg)", "var(--ok)"], warn: ["var(--warn-bg)", "var(--warn)"], info: ["var(--info-bg)", "var(--info)"] };

function Ring({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={8} fill="none" stroke="var(--sun)" strokeWidth={2.5} />
      <circle cx={x + w + 3} cy={y + h / 2} r={9} fill="var(--sun)" />
      <path d={`M${x + w - 1} ${y + h / 2} l3 3 l5 -6`} fill="none" stroke="var(--on-sun)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Photo({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={88} height={78} rx={8} fill="var(--raised)" stroke="var(--edge)" />
      <circle cx={x + 62} cy={y + 24} r={8} fill="var(--sun)" />
      <path d={`M${x + 8} ${y + 68} l24 -30 l16 18 l12 -12 l20 24 z`} fill="var(--edge)" />
    </g>
  );
}

export function StepArt({ art, label }: { art: Art; label: string }) {
  return (
    <svg className="tart" viewBox="0 0 320 222" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
      <rect x={0.5} y={0.5} width={319} height={221} rx={14} fill="var(--card)" stroke="var(--line)" />
      <path d="M0.5 28 V14.5 a14 14 0 0 1 14 -14 H305.5 a14 14 0 0 1 14 14 V28 z" fill="var(--raised)" />
      <T x={14} y={19} size={12} weight={600}>{art.title}</T>
      <circle cx={288} cy={14} r={3} fill="var(--edge)" /><circle cx={298} cy={14} r={3} fill="var(--edge)" /><circle cx={308} cy={14} r={3} fill="var(--edge)" />

      {art.kind === "form" ? (
        <g>
          {art.fields.slice(0, 3).map((f, i) => {
            const top = 40 + i * 44;
            return (
              <g key={f}>
                <T x={14} y={top + 10} size={10} fill="var(--muted)">{f}</T>
                <rect x={14} y={top + 17} width={278} height={22} rx={6} fill="var(--raised)" stroke="var(--edge)" />
                {art.focus === i ? <Ring x={14} y={top + 17} w={278} h={22} /> : null}
              </g>
            );
          })}
          <rect x={14} y={178} width={150} height={30} rx={8} fill="var(--sun)" />
          <T x={89} y={197} size={12} weight={600} fill="var(--on-sun)" anchor="middle">{art.button}</T>
        </g>
      ) : null}

      {art.kind === "list" ? (
        <g>
          {art.items.slice(0, 3).map((it, i) => {
            const top = 40 + i * 52;
            const [bg, fg] = TONE[it.tone];
            return (
              <g key={it.a}>
                <rect x={14} y={top} width={292} height={44} rx={8} fill="var(--raised)" stroke="var(--line)" />
                <T x={26} y={top + 19} size={11} weight={600}>{it.a}</T>
                <T x={26} y={top + 35} size={9.5} fill="var(--muted)">{it.b}</T>
                <rect x={222} y={top + 12} width={74} height={20} rx={10} fill={bg} />
                <T x={259} y={top + 26} size={9} weight={600} fill={fg} anchor="middle">{it.pill}</T>
                {art.focus === i ? <Ring x={14} y={top} w={292} h={44} /> : null}
              </g>
            );
          })}
        </g>
      ) : null}

      {art.kind === "code" ? (
        <g>
          <T x={160} y={64} size={12} fill="var(--muted)" anchor="middle">{art.label}</T>
          {art.digits.split("").slice(0, 6).map((d, i) => (
            <g key={i}>
              <rect x={21 + i * 47} y={80} width={38} height={54} rx={8} fill="var(--raised)" stroke="var(--edge)" />
              <T x={40 + i * 47} y={116} size={26} weight={700} anchor="middle" mono>{d}</T>
            </g>
          ))}
          <T x={160} y={166} size={10.5} fill="var(--muted)" anchor="middle">{art.hint}</T>
        </g>
      ) : null}

      {art.kind === "map" ? (
        <g>
          <rect x={14} y={40} width={292} height={134} rx={8} fill="var(--raised)" stroke="var(--line)" />
          {[70, 100, 130, 160].map((y) => <line key={y} x1={14} x2={306} y1={y} y2={y} stroke="var(--line)" />)}
          {[70, 130, 190, 250].map((x) => <line key={x} y1={40} y2={174} x1={x} x2={x} stroke="var(--line)" />)}
          <path d="M40 150 C 90 150, 100 80, 160 90 S 240 120, 270 62" fill="none" stroke="var(--sun)" strokeWidth={3.5} strokeDasharray="7 6" strokeLinecap="round" />
          <circle cx={40} cy={150} r={6} fill="var(--ok)" />
          <path d="M270 44 a11 11 0 0 1 11 11 c0 8 -11 20 -11 20 s-11 -12 -11 -20 a11 11 0 0 1 11 -11 z" fill="var(--bad)" />
          <circle cx={270} cy={55} r={4} fill="#fff" />
          <T x={160} y={200} size={11} weight={600} anchor="middle">{art.caption}</T>
        </g>
      ) : null}

      {art.kind === "photos" ? (
        <g>
          <Photo x={14} y={44} /><Photo x={116} y={44} /><Photo x={218} y={44} />
          {[58, 160, 262].map((x) => (
            <g key={x}>
              <circle cx={x} cy={138} r={9} fill="var(--ok-bg)" />
              <path d={`M${x - 4} ${138} l3 3 l5 -6`} fill="none" stroke="var(--ok)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
          <T x={160} y={163} size={10.5} fill="var(--muted)" anchor="middle">{art.note}</T>
          <rect x={85} y={178} width={150} height={30} rx={8} fill="var(--sun)" />
          <T x={160} y={197} size={12} weight={600} fill="var(--on-sun)" anchor="middle">{art.button}</T>
        </g>
      ) : null}

      {art.kind === "check" ? (
        <g>
          <circle cx={160} cy={96} r={40} fill="var(--ok-bg)" />
          <circle cx={160} cy={96} r={40} fill="none" stroke="var(--ok)" strokeWidth={3} />
          <path d="M142 97 l13 13 l25 -28" fill="none" stroke="var(--ok)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          <T x={160} y={166} size={13} weight={600} anchor="middle">{art.message}</T>
        </g>
      ) : null}

      <T x={308} y={214} size={8.5} fill="var(--muted)" anchor="end">exemplo</T>
    </svg>
  );
}
