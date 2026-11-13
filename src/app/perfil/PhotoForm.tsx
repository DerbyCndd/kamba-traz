"use client";
import { useActionState, useState } from "react";
import { uploadPhoto, type PhotoState } from "./actions";

export function PhotoForm({ hasPhoto }: { hasPhoto: boolean }) {
  const [state, action, pending] = useActionState<PhotoState, FormData>(uploadPhoto, {});
  const [name, setName] = useState("");
  return (
    <form action={action} className="photoform">
      <label className="btn small" htmlFor="photo">{hasPhoto ? "Trocar foto" : "Escolher foto"}</label>
      <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="srfile"
        onChange={(e) => setName(e.target.files?.[0]?.name ?? "")} />
      {name ? <span className="hint">{name}</span> : null}
      {name ? <button type="submit" className="btn primary small" disabled={pending}>{pending ? "A enviar…" : "Guardar foto"}</button> : null}
      {state.error ? <p className="err" role="alert">{state.error}</p> : null}
      {state.done && !name ? <p className="hint" role="status">Foto guardada.</p> : null}
    </form>
  );
}
