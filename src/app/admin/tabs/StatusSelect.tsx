"use client";
import { useTransition } from "react";
import { setItemStatus } from "../actions";

export function StatusSelect({ kind, id, value, options }: { kind: "trip" | "request"; id: string; value: string; options: [string, string][] }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={kind === "trip" ? "Estado da viagem" : "Estado do pedido"}
      style={{ maxWidth: 200 }}
      value={value}
      disabled={pending}
      onChange={(e) => { const v = e.target.value; start(async () => { await setItemStatus(kind, id, v); }); }}
    >
      {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
    </select>
  );
}
