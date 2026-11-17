"use client";
import { useActionState } from "react";
import { Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { TwoStepButton } from "@/components/TwoStepButton";
import { addTeamMember, removeTeamMember, type AdminState } from "../actions";

export type TeamMember = { id: string; email: string; full_name: string; role: string; is_owner: boolean };

/** Quem é da equipa. Só o dono vê este separador e escolhe quem entra ou sai. */
export function EquipaTab({ members }: { members: TeamMember[] }) {
  const [state, action] = useActionState(addTeamMember, {} as AdminState);
  return (
    <div className="list">
      <div className="panel">
        <h3>Acrescentar alguém à equipa</h3>
        <p className="muted">A pessoa tem de se registar primeiro no site e confirmar o email. Depois escreve aqui o email dela. Quem entra na equipa vê todos os documentos, números, selfies, moradas e familiares, aprova e recusa entradas, confirma pagamentos e muda as definições. Acrescenta só quem merece essa confiança.</p>
        <form action={action}>
          <div className="fields">
            <Field id="team-email" label="Email da pessoa" full>
              <input id="team-email" name="email" type="email" autoComplete="off" placeholder="nome@exemplo.com" required />
            </Field>
          </div>
          <div className="row">
            <SubmitButton pending="A acrescentar…">Acrescentar à equipa</SubmitButton>
            {state.message ? <span className="hint" role="status">{state.message}</span> : null}
            {state.error ? <span className="err" role="alert">{state.error}</span> : null}
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>A equipa <span className="cnt">{members.length}</span></h3>
        <div className="list">
          {members.map((m) => (
            <div className="row" key={m.id}>
              <span><b>{m.full_name || "Sem nome"}</b> · {m.email}</span>
              {m.is_owner ? <span className="pill info">DONO</span> : <TwoStepButton label="Retirar da equipa" action={removeTeamMember.bind(null, m.email)} />}
            </div>
          ))}
        </div>
        <p className="hint">Retirar alguém tira-lhe o acesso ao painel de imediato. A conta continua a existir como utilizador normal.</p>
      </div>
    </div>
  );
}
