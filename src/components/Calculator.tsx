"use client";
import { useState } from "react";
import { kz } from "@/lib/format";

export function Calculator({ perKg, commission }: { perKg: number; commission: number }) {
  const [raw, setRaw] = useState("5");
  const kg = Math.max(0, parseFloat(raw) || 0);
  const total = kg * perKg;
  const fee = (total * commission) / 100;
  return (
    <div className="calc">
      <div className="field">
        <label htmlFor="c-kg">Peso da encomenda (kg)</label>
        <input id="c-kg" type="number" min="0.5" step="0.5" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} />
      </div>
      <div className="sum">
        <div><span className="label">Frete estimado</span><b>{kz(total)}</b></div>
        <div><span className="label">Viajante recebe</span><b>{kz(total - fee)}</b></div>
        <div><span className="label">Taxa Kamba</span><b>{kz(fee)}</b><span className="label">Kamba {commission}%</span></div>
      </div>
    </div>
  );
}
