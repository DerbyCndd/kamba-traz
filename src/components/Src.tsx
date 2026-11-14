import { SOURCES, type SourceRef } from "@/lib/sources";

/** Linha de fonte, com ligação ao documento original. Só se usa para o que confirmámos. */
export function Src({ refs }: { refs: SourceRef[] }) {
  return (
    <span className="src">
      <span className="srclabel">Fonte:</span>{" "}
      {refs.map(([key, ref], i) => (
        <span key={key + (ref ?? "")}>
          {i > 0 ? " · " : ""}
          <a href={SOURCES[key].url} target="_blank" rel="noopener noreferrer">{SOURCES[key].short}{ref ? `, ${ref}` : ""}</a>
        </span>
      ))}
    </span>
  );
}
