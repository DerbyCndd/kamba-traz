"use client";
import { useState } from "react";
import { kz } from "@/lib/format";

/** Quanto custa enviar: o produto a funcionar logo no primeiro ecrã. Valores de referência; o final é combinado entre as partes. */
export function Calculator({ perKg, commission, cta }: { perKg: number; commission: number; cta?: React.ReactNode }) {
  const [raw, setRaw] = useState("5");
  const kg = Math.max(0, parseFloat(raw) || 0);
  const total = kg * perKg;
  const fee = (total * commission) / 100;
  return (
    <div className="calccard">
      <h3>Quanto custa enviar?</h3>
      <div className="field">
        <label htmlFor="c-kg">Peso da encomenda</label>
        <div className="kginput">
          <input id="c-kg" type="number" min="0.5" step="0.5" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} />
          <span>kg</span>
        </div>
      </div>
      <dl className="calcrows">
        <div><dt>Frete estimado</dt><dd>{kz(total)}</dd></div>
        <div><dt>O viajante recebe</dt><dd>{kz(total - fee)}</dd></div>
        <div><dt>Taxa Kamba ({commission}%)</dt><dd>{kz(fee)}</dd></div>
      </dl>
      <p className="hint">Valor de referência de {kz(perKg)} por kg. O valor final é combinado entre as duas partes.</p>
      {cta}
    </div>
  );
}
