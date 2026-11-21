"use client";
import { useState } from "react";
import { Field } from "./ui";

/** Ligação de um mapa, escrita ou preenchida com a localização atual (a pessoa confirma que é o sítio certo). */
export function MapField({ id, name, label, hint, error, defaultValue }: { id: string; name?: string; label: string; hint: string; error?: string; defaultValue?: string }) {
  const [map, setMap] = useState(defaultValue ?? "");
  const [msg, setMsg] = useState("");

  function fill() {
    if (!navigator.geolocation) { setMsg("O teu navegador não permite obter a localização."); return; }
    setMsg("A obter a localização…");
    navigator.geolocation.getCurrentPosition(
      (p) => { setMap(`https://www.google.com/maps?q=${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)}`); setMsg("Localização preenchida. Confirma que é o sítio certo."); },
      () => setMsg("Não foi possível obter a localização. Escreve a morada ou cola uma ligação do mapa."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <>
      <Field id={id} label={label} hint={hint} error={error} full>
        <input id={id} name={name ?? id} inputMode="url" maxLength={300} placeholder="https://maps.google.com/…" value={map} onChange={(ev) => setMap(ev.target.value)} />
      </Field>
      <div className="field full">
        <button type="button" className="btn small" onClick={fill}>Usar a minha localização atual</button>
        {msg ? <span className="hint" role="status"> {msg}</span> : null}
      </div>
    </>
  );
}
