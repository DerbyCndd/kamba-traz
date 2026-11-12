"use client";
import { useActionState } from "react";
import { saveConfig, type AdminState } from "../actions";
import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import type { Config } from "@/lib/types";

export function Definicoes({ config }: { config: Config }) {
  const [state, action] = useActionState(saveConfig, {} as AdminState);
  return (
    <div className="panel">
      <h3>Definições do negócio</h3>
      <form action={action}>
        <div className="fields">
          <Field id="s-com" label="Comissão da Kamba (%)" hint="Aplica-se a novas entregas.">
            <input id="s-com" name="commission" type="number" min="0" max="50" step="0.5" defaultValue={config.commission} />
          </Field>
          <Field id="s-kg" label="Preço de referência por kg (Kz)" hint="Valor inicial. Substitui pelos preços reais que ouvires do mercado.">
            <input id="s-kg" name="per_kg" type="number" min="0" step="500" defaultValue={config.per_kg} />
          </Field>
          <Field id="s-wa" label="WhatsApp da equipa" hint="Aparece nos botões “Quero enviar” e no resumo dos formulários.">
            <input id="s-wa" name="whatsapp" type="tel" placeholder="+351 9XX XXX XXX" defaultValue={config.whatsapp} />
          </Field>
        </div>
        <div className="row">
          <SubmitButton pending="A guardar…">Guardar definições</SubmitButton>
          {state.message ? <span className="hint" role="status">{state.message}</span> : null}
          {state.error ? <span className="err" role="alert">{state.error}</span> : null}
        </div>
      </form>
    </div>
  );
}
