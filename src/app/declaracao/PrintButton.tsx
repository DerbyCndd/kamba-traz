"use client";

export function PrintButton() {
  return <button type="button" className="btn small" onClick={() => window.print()}>Imprimir ou guardar em PDF</button>;
}
