"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copiar", className = "btn small" }: { text: string; label?: string; className?: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copiado");
    } catch {
      setMsg("Seleccione e copie");
    }
    setTimeout(() => setMsg(null), 1500);
  }
  return <button type="button" className={className} onClick={copy}>{msg ?? label}</button>;
}
